import type { CameraProfile } from "./types";

export const CAMERAS: CameraProfile[] = [
  {
    id: "fujifilm-x-t30-ii",
    brand: "Fujifilm",
    model: "X-T30 II",
    fullName: "Fujifilm X-T30 II",
    bodyClass: "mirrorless",
    controls: {
      aperture:
        "If your lens has an aperture ring (most XF/XC primes), rotate the ring to your desired f-stop. If it has no ring (XC zooms like XC15-45), use the FRONT command dial. Set the ring to red 'A' to let the camera choose.",
      shutterSpeed:
        "Top shutter speed dial. Turn to the speed you want (e.g., 1/250). For values not on the dial, set the dial to 'T' and use the rear command dial. Set to 'A' for Aperture Priority.",
      iso: "No dedicated ISO dial. Press the Q button → ISO. Or assign ISO to a function button via Setup → Button/Dial Setting → Function (Fn) Setting.",
      exposureCompensation:
        "Top right exposure compensation dial (-3 to +3). Turn for brighter/darker. Set to 'C' for ±5 stops via the front dial.",
      modes:
        "P = aperture ring + shutter dial both at A. A = aperture ring on f-stop, shutter dial at A. S = ring at A, shutter dial at speed. M = both set explicitly.",
      signature:
        "Film Simulations: Q menu → Film Simulation. Try Classic Chrome (documentary), Astia (portraits), Velvia (landscapes), or Acros for B&W.",
    },
    sensorClass: "APS-C",
  },
  {
    id: "fujifilm-x-t5",
    brand: "Fujifilm",
    model: "X-T5",
    fullName: "Fujifilm X-T5",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Aperture ring on the lens (or front command dial for ringless lenses). Ring to 'A' for auto.",
      shutterSpeed: "Top shutter speed dial; set to 'T' and use rear command dial for off-dial speeds; 'A' for Aperture Priority.",
      iso: "Dedicated ISO dial on the top left. Lift and turn to your desired value.",
      exposureCompensation: "Top right EV dial (-3 to +3); 'C' for ±5 stops via front dial.",
      modes: "Mode is set by the combination of the aperture ring and shutter dial positions, like the X-T30 II.",
      signature: "Film Simulations: Q menu → Film Simulation. Try Reala Ace, Classic Chrome, Velvia, or Acros.",
    },
    sensorClass: "APS-C",
  },
  {
    id: "fujifilm-x100v",
    brand: "Fujifilm",
    model: "X100V / X100VI",
    fullName: "Fujifilm X100V / X100VI",
    bodyClass: "rangefinder",
    controls: {
      aperture: "Aperture ring on the fixed 23mm lens. 'A' for auto aperture.",
      shutterSpeed: "Top shutter speed dial; pull up the inner ring for ISO; 'A' for Aperture Priority. Leaf shutter syncs flash at all speeds.",
      iso: "Lift the inner ring of the shutter dial and turn it. 'A' for Auto ISO.",
      exposureCompensation: "Top right EV dial.",
      modes: "Aperture ring + shutter dial combinations (P/A/S/M).",
      signature: "Hybrid OVF/EVF — flick the front lever to switch. Film Simulations via Q menu.",
    },
    sensorClass: "APS-C",
  },
  {
    id: "sony-a6400",
    brand: "Sony",
    model: "α6400",
    fullName: "Sony α6400",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Rear control wheel in A or M mode.",
      shutterSpeed: "Rear control wheel in S, or front control wheel in M.",
      iso: "ISO button (right side of rear) or via Fn menu.",
      exposureCompensation: "Hold C2 (top) and turn the rear wheel, or assign EV to the rear wheel directly.",
      modes: "Top PASM mode dial.",
    },
    sensorClass: "APS-C",
  },
  {
    id: "sony-a7iv",
    brand: "Sony",
    model: "α7 IV",
    fullName: "Sony α7 IV",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Front dial in A/M mode.",
      shutterSpeed: "Rear dial in S/M mode.",
      iso: "ISO button (top) or rear control wheel/Fn menu.",
      exposureCompensation: "Dedicated EV wheel on top right.",
      modes: "Top PASM dial with the still/movie/S&Q switch underneath.",
    },
    sensorClass: "Full-frame",
  },
  {
    id: "canon-r50",
    brand: "Canon",
    model: "EOS R50",
    fullName: "Canon EOS R50",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Main dial (top of grip) in Av/M mode.",
      shutterSpeed: "Main dial in Tv/M mode.",
      iso: "M-Fn button → ISO, or set Auto ISO range in menu.",
      exposureCompensation: "Quick control dial on the rear (the wheel around the SET button) in P/Av/Tv.",
      modes: "Top PASM-style mode dial; A+ for full auto.",
    },
    sensorClass: "APS-C",
  },
  {
    id: "canon-r8",
    brand: "Canon",
    model: "EOS R8",
    fullName: "Canon EOS R8",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Main dial (top of grip) in Av/M.",
      shutterSpeed: "Main dial in Tv/M.",
      iso: "ISO button on the top, or M-Fn button cycle.",
      exposureCompensation: "Rear quick control dial.",
      modes: "Top mode dial.",
    },
    sensorClass: "Full-frame",
  },
  {
    id: "nikon-zfc",
    brand: "Nikon",
    model: "Z fc",
    fullName: "Nikon Z fc",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Sub-command (front) dial in A/M mode. Or, if the lens has an aperture ring, the ring.",
      shutterSpeed: "Top shutter dial. Set to 1/3 STEP to use the dial in 1-stop intervals; for finer control, use the rear dial.",
      iso: "Top ISO dial — lift the surround and turn.",
      exposureCompensation: "Top exposure compensation dial.",
      modes: "Set by the combination of dials; an A/M switch is on the front near the lens mount.",
    },
    sensorClass: "APS-C",
  },
  {
    id: "nikon-z50",
    brand: "Nikon",
    model: "Z50 / Z50 II",
    fullName: "Nikon Z50 / Z50 II",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Sub-command (front) dial in A/M.",
      shutterSpeed: "Main (rear) command dial in S/M.",
      iso: "ISO button + rear command dial. Auto ISO toggle is in the menu.",
      exposureCompensation: "EV button (+/−) + rear command dial.",
      modes: "Top PASM dial.",
    },
    sensorClass: "APS-C",
  },
  {
    id: "panasonic-s5ii",
    brand: "Panasonic",
    model: "Lumix S5 II",
    fullName: "Panasonic Lumix S5 II",
    bodyClass: "mirrorless",
    controls: {
      aperture: "Rear dial in A/M.",
      shutterSpeed: "Front dial in S/M.",
      iso: "ISO button on top, or assigned Fn button.",
      exposureCompensation: "EV button + dial, or assigned Fn dial.",
      modes: "Top PASM dial with movie + custom modes.",
    },
    sensorClass: "Full-frame",
  },
  {
    id: "iphone-recent",
    brand: "Apple",
    model: "iPhone (recent)",
    fullName: "iPhone (recent)",
    bodyClass: "phone",
    controls: {
      aperture: "Lens aperture is fixed. To soften backgrounds, use Portrait mode (or Cinematic for video) and adjust the depth slider after the shot.",
      shutterSpeed:
        "Not directly controllable in the default Camera app. For manual control, use Halide, ProCamera, or Lightroom Mobile.",
      iso: "Same as shutter — not in the default app. Use a third-party manual app.",
      exposureCompensation:
        "Tap to focus on a subject, then drag the sun icon up or down on the right side to bias exposure.",
      modes: "Photo, Portrait, Night, Pano, etc. via the bottom carousel. Night mode auto-engages in low light.",
      signature:
        "Use ProRAW (Settings → Camera → Formats → Apple ProRAW) for the most editable files in Lightroom.",
    },
    sensorClass: "Phone",
  },
  {
    id: "pixel-recent",
    brand: "Google",
    model: "Pixel (recent)",
    fullName: "Google Pixel (recent)",
    bodyClass: "phone",
    controls: {
      aperture: "Fixed; control depth via Portrait mode.",
      shutterSpeed:
        "Default app is auto-only. For manual, use Lightroom Mobile, Open Camera, or ProShot.",
      iso: "Same as shutter — manual app required.",
      exposureCompensation:
        "Tap to focus, then drag the brightness slider that appears.",
      modes: "Photo / Portrait / Night Sight / Long Exposure / Action Pan via the bottom carousel.",
    },
    sensorClass: "Phone",
  },
];

export const CAMERA_BRANDS = Array.from(
  new Set(CAMERAS.map((c) => c.brand)),
).sort();

export function findCamera(id: string | null | undefined): CameraProfile | null {
  if (!id) return null;
  return CAMERAS.find((c) => c.id === id) ?? null;
}
