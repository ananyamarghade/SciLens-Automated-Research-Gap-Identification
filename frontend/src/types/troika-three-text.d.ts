declare module 'troika-three-text' {
  import * as THREE from 'three';

  export class Text extends THREE.Mesh {
    text: string;
    fontSize: number;
    font?: string;
    color?: string | number | THREE.Color;
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: 'left' | 'right' | 'center' | 'justify';
    anchorX?: number | 'left' | 'center' | 'right';
    anchorY?: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom';
    depthOffset?: number;
    clipRect?: [number, number, number, number];
    curveRadius?: number;
    maxWidth?: number;
    overflowWrap?: 'normal' | 'break-word';
    whiteSpace?: 'normal' | 'nowrap';
    outlineWidth?: number | string;
    outlineColor?: string | number | THREE.Color;
    outlineOpacity?: number;
    outlineBlur?: number | string;
    strokeWidth?: number | string;
    strokeColor?: string | number | THREE.Color;
    strokeOpacity?: number;
    fillOpacity?: number;
    debugSDF?: boolean;
    sync(callback?: () => void): void;
    dispose(): void;
  }
}
