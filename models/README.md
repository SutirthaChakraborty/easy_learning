# ml5.js AI Models

Place trained Teachable Machine model files here.

## Phonics Sound Classifier

Folder: `phonics-sound/`

Required files (exported from Teachable Machine):

- `model.json`
- `metadata.json`
- `weights.bin`

### How to Train Your Model

1. Go to [Teachable Machine Sound](https://teachablemachine.withgoogle.com/train/audio)
2. Create classes for each phonics sound (e.g. "A", "B", "Short-E", etc.)
3. Record 20–30 samples per class
4. Train the model
5. Click **Export Model → Download** (TensorFlow.js format)
6. Place the exported files in `models/phonics-sound/`

### Integration

Already wired in `public/js/ml5-integration.js`:

```javascript
import { PhonicsChecker } from './ml5-integration.js';

await PhonicsChecker.init('models/phonics-sound/');
PhonicsChecker.startListening((label, confidence) => {
  console.log(`Heard: ${label} (${(confidence * 100).toFixed(0)}%)`);
});
```

## Hand Pose (Air-Trace Letter Game)

No model files needed — ml5.js HandPose uses MediaPipe's pre-trained model loaded from CDN.

## Face API (Emotion Detection)

No local files needed — ml5.js faceApi uses pre-trained weights from CDN.

> Note: Face API is disabled by default (privacy). Enable in `ml5-integration.js` feature flags.
