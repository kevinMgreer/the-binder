package io.github.kevinmgreer.thebinder;

import android.content.res.Configuration;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BinderAuthPlugin.class);
        registerPlugin(BinderScannerPlugin.class);
        super.onCreate(savedInstanceState);
        matchSystemBarsToTheme();
    }

    // uiMode is a handled config change, so the activity is not recreated when the phone
    // switches between light and dark; redo the bar icon colours here.
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        matchSystemBarsToTheme();
    }

    // Dark icons on the light theme's bars, light icons on the dark theme's.
    private void matchSystemBarsToTheme() {
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(!night);
        controller.setAppearanceLightNavigationBars(!night);
    }
}
