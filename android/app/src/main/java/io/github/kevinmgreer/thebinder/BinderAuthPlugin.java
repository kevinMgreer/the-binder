package io.github.kevinmgreer.thebinder;

import android.accounts.Account;
import android.app.Activity;
import android.app.PendingIntent;
import android.os.CancellationSignal;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.GoogleAuthUtil;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.Scope;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

/**
 * Google sign-in (Credential Manager) and Drive authorization for the web layer.
 * Every method resolves with a null account/authorization when the user cancels or access is refused,
 * so the JavaScript side can tell "declined" apart from a real failure.
 */
@CapacitorPlugin(name = "BinderAuth")
public class BinderAuthPlugin extends Plugin {

    // Google access tokens last an hour; report a little less so renewal happens before expiry.
    private static final long ACCESS_TOKEN_SECONDS = 55 * 60;

    private ActivityResultLauncher<IntentSenderRequest> consentLauncher;
    private PluginCall pendingConsent;

    @Override
    public void load() {
        consentLauncher = getBridge().registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), this::onConsentResult);
    }

    // A build without VITE_GOOGLE_WEB_CLIENT_ID sends no ID; reject instead of crashing the app.
    private String requireClientId(PluginCall call) {
        String id = call.getString("serverClientId");
        if (id == null || id.isEmpty()) {
            call.reject("Google web client ID is not configured");
            return null;
        }
        return id;
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        String serverClientId = requireClientId(call);
        if (serverClientId == null) return;
        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(new GetSignInWithGoogleOption.Builder(serverClientId).build())
            .build();
        getAccount(call, request);
    }

    @PluginMethod
    public void silentSignIn(PluginCall call) {
        String serverClientId = requireClientId(call);
        if (serverClientId == null) return;
        GetGoogleIdOption option = new GetGoogleIdOption.Builder()
            .setServerClientId(serverClientId)
            .setFilterByAuthorizedAccounts(true)
            .setAutoSelectEnabled(true)
            .build();
        getAccount(call, new GetCredentialRequest.Builder().addCredentialOption(option).build());
    }

    @PluginMethod
    public void authorize(PluginCall call) {
        boolean interactive = Boolean.TRUE.equals(call.getBoolean("interactive", false));
        List<Scope> scopes = new ArrayList<>();
        try {
            for (Object scope : call.getArray("scopes").toList()) scopes.add(new Scope((String) scope));
        } catch (Exception e) {
            call.reject("Invalid scopes");
            return;
        }
        AuthorizationRequest.Builder builder = AuthorizationRequest.builder().setRequestedScopes(scopes);
        String email = call.getString("email", "");
        if (!email.isEmpty()) builder.setAccount(new Account(email, "com.google"));
        AuthorizationRequest request = builder.build();
        Identity.getAuthorizationClient(getActivity())
            .authorize(request)
            .addOnSuccessListener(result -> {
                if (!result.hasResolution()) {
                    resolveAuthorization(call, result);
                } else if (!interactive) {
                    resolveAuthorization(call, null);
                } else {
                    PendingIntent consent = result.getPendingIntent();
                    pendingConsent = call;
                    consentLauncher.launch(new IntentSenderRequest.Builder(consent.getIntentSender()).build());
                }
            })
            .addOnFailureListener(e -> call.reject("Drive authorization failed: " + e.getMessage()));
    }

    @PluginMethod
    public void clearCredentialState(PluginCall call) {
        CredentialManager.create(getActivity())
            .clearCredentialStateAsync(
                new ClearCredentialStateRequest(),
                new CancellationSignal(),
                ContextCompat.getMainExecutor(getContext()),
                new CredentialManagerCallback<Void, ClearCredentialException>() {
                    @Override
                    public void onResult(Void result) {
                        call.resolve();
                    }

                    @Override
                    public void onError(ClearCredentialException e) {
                        call.reject("Could not clear credential state: " + e.getMessage());
                    }
                }
            );
    }

    /**
     * Drops a token from Play services' cache. After sign-out revokes a token over HTTP the cache still holds it, and the next
     * authorize() hands the revoked token back, so Drive answers 401 and sync pauses.
     */
    @PluginMethod
    public void clearToken(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isEmpty()) {
            call.reject("No token to clear");
            return;
        }
        GoogleAuthUtil.invalidateToken(getContext(), token);
        call.resolve();
    }

    private void getAccount(PluginCall call, GetCredentialRequest request) {
        CredentialManager.create(getActivity())
            .getCredentialAsync(
                getActivity(),
                request,
                new CancellationSignal(),
                ContextCompat.getMainExecutor(getContext()),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        Credential credential = response.getCredential();
                        if (credential instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                            try {
                                GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
                                JSObject account = new JSObject();
                                account.put("idToken", google.getIdToken());
                                account.put("email", google.getId());
                                JSObject result = new JSObject();
                                result.put("account", account);
                                call.resolve(result);
                            } catch (Exception e) {
                                call.reject("Could not read the Google credential: " + e.getMessage());
                            }
                        } else {
                            call.reject("Unexpected credential type");
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        if (e instanceof GetCredentialCancellationException || e instanceof NoCredentialException) {
                            JSObject result = new JSObject();
                            result.put("account", JSONObject.NULL);
                            call.resolve(result);
                        } else {
                            call.reject("Google sign-in failed: " + e.getMessage());
                        }
                    }
                }
            );
    }

    private void onConsentResult(ActivityResult result) {
        PluginCall call = pendingConsent;
        pendingConsent = null;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            resolveAuthorization(call, null);
            return;
        }
        try {
            resolveAuthorization(call, Identity.getAuthorizationClient(getActivity()).getAuthorizationResultFromIntent(result.getData()));
        } catch (Exception e) {
            call.reject("Drive authorization failed: " + e.getMessage());
        }
    }

    private void resolveAuthorization(PluginCall call, AuthorizationResult result) {
        JSObject response = new JSObject();
        if (result == null || result.getAccessToken() == null) {
            response.put("authorization", JSONObject.NULL);
        } else {
            JSObject authorization = new JSObject();
            authorization.put("accessToken", result.getAccessToken());
            authorization.put("expiresInSeconds", ACCESS_TOKEN_SECONDS);
            response.put("authorization", authorization);
        }
        call.resolve(response);
    }
}
