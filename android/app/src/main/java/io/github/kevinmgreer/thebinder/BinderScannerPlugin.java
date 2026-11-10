package io.github.kevinmgreer.thebinder;

import android.app.Activity;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.mlkit.vision.documentscanner.GmsDocumentScanner;
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions;
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning;
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult;
import java.util.List;
import org.json.JSONObject;

/**
 * Card scanner for the web layer: Google's ML Kit Document Scanner (rear camera, edge detection, crop).
 * scan() resolves with the cropped image's file uri, or a null uri when the user closes the scanner, and rejects with the
 * code UNAVAILABLE when the scanner cannot run (no Google Play services, or its module cannot be fetched), so the web
 * layer can fall back to the system camera.
 */
@CapacitorPlugin(name = "BinderScanner")
public class BinderScannerPlugin extends Plugin {

    private ActivityResultLauncher<IntentSenderRequest> scanLauncher;
    private PluginCall pendingScan;

    @Override
    public void load() {
        scanLauncher = getBridge().registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), this::onScanResult);
    }

    @PluginMethod
    public void scan(PluginCall call) {
        if (pendingScan != null) {
            call.reject("A scan is already open");
            return;
        }
        if (GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(getContext()) != ConnectionResult.SUCCESS) {
            call.reject("Google Play services is not available", "UNAVAILABLE");
            return;
        }
        // BASE mode: crop and rotate only; the default FULL mode adds filters and cleaning tools the app does not want.
        GmsDocumentScannerOptions options = new GmsDocumentScannerOptions.Builder()
            .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_BASE)
            .setPageLimit(1)
            .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
            .setGalleryImportAllowed(false)
            .build();
        GmsDocumentScanner scanner = GmsDocumentScanning.getClient(options);
        pendingScan = call;
        scanner
            .getStartScanIntent(getActivity())
            .addOnSuccessListener(intentSender -> scanLauncher.launch(new IntentSenderRequest.Builder(intentSender).build()))
            .addOnFailureListener(e -> {
                pendingScan = null;
                call.reject("Scanner could not start: " + e.getMessage(), "UNAVAILABLE");
            });
    }

    private void onScanResult(ActivityResult result) {
        PluginCall call = pendingScan;
        pendingScan = null;
        if (call == null) return;
        JSObject response = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            response.put("uri", JSONObject.NULL);
            call.resolve(response);
            return;
        }
        GmsDocumentScanningResult scanned = GmsDocumentScanningResult.fromActivityResultIntent(result.getData());
        List<GmsDocumentScanningResult.Page> pages = scanned == null ? null : scanned.getPages();
        if (pages == null || pages.isEmpty()) {
            response.put("uri", JSONObject.NULL);
            call.resolve(response);
            return;
        }
        Uri image = pages.get(0).getImageUri();
        response.put("uri", image.toString());
        call.resolve(response);
    }
}
