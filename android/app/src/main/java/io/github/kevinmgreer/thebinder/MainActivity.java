package io.github.kevinmgreer.thebinder;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BinderAuthPlugin.class);
        registerPlugin(BinderScannerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
