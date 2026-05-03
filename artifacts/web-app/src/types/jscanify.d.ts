declare module "jscanify" {
  interface CornerPoints {
    topLeftCorner: { x: number; y: number } | undefined;
    topRightCorner: { x: number; y: number } | undefined;
    bottomLeftCorner: { x: number; y: number } | undefined;
    bottomRightCorner: { x: number; y: number } | undefined;
  }
  class JscanifyClass {
    constructor();
    findPaperContour(img: unknown): unknown | null;
    getCornerPoints(contour: unknown): CornerPoints;
    highlightPaper(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement, options?: { color?: string; thickness?: number }): HTMLCanvasElement;
    extractPaper(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement, resultWidth: number, resultHeight: number, cornerPoints?: CornerPoints): HTMLCanvasElement | null;
  }
  export default JscanifyClass;
}

declare module "jscanify/client" {
  interface CornerPoints {
    topLeftCorner: { x: number; y: number } | undefined;
    topRightCorner: { x: number; y: number } | undefined;
    bottomLeftCorner: { x: number; y: number } | undefined;
    bottomRightCorner: { x: number; y: number } | undefined;
  }
  class JscanifyClass {
    constructor();
    findPaperContour(img: unknown): unknown | null;
    getCornerPoints(contour: unknown): CornerPoints;
    highlightPaper(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement, options?: { color?: string; thickness?: number }): HTMLCanvasElement;
    extractPaper(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement, resultWidth: number, resultHeight: number, cornerPoints?: CornerPoints): HTMLCanvasElement | null;
  }
  export default JscanifyClass;
}
