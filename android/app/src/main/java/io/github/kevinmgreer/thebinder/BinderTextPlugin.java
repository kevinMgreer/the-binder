package io.github.kevinmgreer.thebinder;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/**
 * On-device text recognition for the web layer: ML Kit Text Recognition v2 (Latin) with the model bundled in the APK,
 * so it works offline from the first launch. recognize({ image }) takes a base64 image and resolves with { text },
 * the recognized lines separated by newlines (empty when nothing is readable).
 */
@CapacitorPlugin(name = "BinderText")
public class BinderTextPlugin extends Plugin {

    private TextRecognizer recognizer;

    @Override
    public void load() {
        recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
    }

    @Override
    protected void handleOnDestroy() {
        if (recognizer != null) recognizer.close();
    }

    @PluginMethod
    public void recognize(PluginCall call) {
        String encoded = call.getString("image");
        if (encoded == null) {
            call.reject("image is required");
            return;
        }
        byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
        Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        if (bitmap == null) {
            call.reject("The image could not be decoded");
            return;
        }
        recognizer
            .process(InputImage.fromBitmap(bitmap, 0))
            .addOnSuccessListener(result -> {
                StringBuilder text = new StringBuilder();
                for (com.google.mlkit.vision.text.Text.TextBlock block : result.getTextBlocks()) {
                    for (com.google.mlkit.vision.text.Text.Line line : block.getLines()) text.append(line.getText()).append('\n');
                }
                JSObject response = new JSObject();
                response.put("text", text.toString());
                call.resolve(response);
            })
            .addOnFailureListener(e -> call.reject("Text recognition failed: " + e.getMessage()));
    }
}
