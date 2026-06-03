import * as faceapi from 'face-api.js';

// Using models from a reliable CDN for immediate prototype functionality
// In production, these should be hosted in /public/models
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let isModelLoaded = false;

/**
 * Loads the necessary face-api.js models.
 * Optimized for performance using TinyFaceDetector.
 */
export const loadFaceModels = async () => {
  if (isModelLoaded) return true;
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    isModelLoaded = true;
    console.log("Face models loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading face models:", error);
    return false;
  }
};

/**
 * Extracts a 128-float face descriptor from a video or image element.
 */
export const extractFaceDescriptor = async (inputElement) => {
  if (!isModelLoaded) await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(inputElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
};

/**
 * Compares two face descriptors and returns the distance (Euclidean).
 * Standard threshold for face match is ~0.6 (lower is better).
 */
export const compareFaces = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2) return 1.0;
  
  // Convert descriptors to Float32Array if they are strings/arrays
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(Object.values(descriptor1));
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(Object.values(descriptor2));
  
  return faceapi.euclideanDistance(d1, d2);
};

/**
 * Checks if a descriptor matches a reference with a strict threshold.
 */
export const isFaceMatch = (descriptor1, descriptor2, threshold = 0.5) => {
  const distance = compareFaces(descriptor1, descriptor2);
  return distance < threshold;
};
