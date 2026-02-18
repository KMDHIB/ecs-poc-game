import { Registry } from "@app/esc/registry";
import {
  Position,
  Renderable,
  Ship,
  Health,
  DamageIndicator,
  Explosion,
} from "@app/esc/components";
import { GameState } from "@app/game/types";

// Vertex shader for instanced rendering
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_instancePosition;
  attribute float a_instanceRadius;
  attribute vec3 a_instanceColor;
  attribute float a_instanceOpacity;
  attribute float a_instanceRotation;
  attribute float a_instanceShape; // 0 = circle, 1 = triangle

  uniform vec2 u_resolution;

  varying vec3 v_color;
  varying float v_opacity;
  varying vec2 v_uv;
  varying float v_shape;

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  void main() {
    v_color = a_instanceColor;
    v_opacity = a_instanceOpacity;
    v_shape = a_instanceShape;
    v_uv = a_position;

    vec2 pos = a_position;
    
    // For triangles, adjust vertices to form a proper triangle shape
    if (a_instanceShape > 0.5) {
      // Triangle: point forward, base back
      if (abs(pos.x + 1.0) < 0.1) {
        // Left vertices
        pos = vec2(-0.5, pos.y * 0.5);
      } else if (abs(pos.x - 1.0) < 0.1) {
        // Right vertex (tip)
        pos = vec2(1.0, 0.0);
      }
    }

    // Apply rotation and scale
    vec2 rotated = rotate2d(a_instanceRotation) * (pos * a_instanceRadius);
    vec2 worldPosition = a_instancePosition + rotated;

    // Convert to clip space
    vec2 clipSpace = (worldPosition / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

// Fragment shader
const fragmentShaderSource = `
  precision mediump float;

  varying vec3 v_color;
  varying float v_opacity;
  varying vec2 v_uv;
  varying float v_shape;

  void main() {
    float alpha = v_opacity;

    if (v_shape < 0.5) {
      // Circle
      float dist = length(v_uv);
      if (dist > 1.0) {
        discard;
      }
    }
    // Triangle rendering happens automatically via vertex positions

    gl_FragColor = vec4(v_color, alpha);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export class GPURenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private locations: {
    position: number;
    instancePosition: number;
    instanceRadius: number;
    instanceColor: number;
    instanceOpacity: number;
    instanceRotation: number;
    instanceShape: number;
    resolution: WebGLUniformLocation | null;
  };
  private quadBuffer: WebGLBuffer;
  private instancePositionBuffer: WebGLBuffer;
  private instanceRadiusBuffer: WebGLBuffer;
  private instanceColorBuffer: WebGLBuffer;
  private instanceOpacityBuffer: WebGLBuffer;
  private instanceRotationBuffer: WebGLBuffer;
  private instanceShapeBuffer: WebGLBuffer;
  private ext: ANGLE_instanced_arrays | null;
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    this.gl = gl;

    // Get instancing extension
    this.ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!this.ext) {
      console.warn('Instanced rendering not supported, performance may be reduced');
    }

    // Create shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders');
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      throw new Error('Failed to create program');
    }

    this.program = program;

    // Get attribute/uniform locations
    this.locations = {
      position: gl.getAttribLocation(program, 'a_position'),
      instancePosition: gl.getAttribLocation(program, 'a_instancePosition'),
      instanceRadius: gl.getAttribLocation(program, 'a_instanceRadius'),
      instanceColor: gl.getAttribLocation(program, 'a_instanceColor'),
      instanceOpacity: gl.getAttribLocation(program, 'a_instanceOpacity'),
      instanceRotation: gl.getAttribLocation(program, 'a_instanceRotation'),
      instanceShape: gl.getAttribLocation(program, 'a_instanceShape'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
    };

    // Create quad buffer for circle/shape base geometry
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Create instance buffers
    this.instancePositionBuffer = gl.createBuffer()!;
    this.instanceRadiusBuffer = gl.createBuffer()!;
    this.instanceColorBuffer = gl.createBuffer()!;
    this.instanceOpacityBuffer = gl.createBuffer()!;
    this.instanceRotationBuffer = gl.createBuffer()!;
    this.instanceShapeBuffer = gl.createBuffer()!;

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Create overlay canvas for text rendering
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = canvas.width;
    this.overlayCanvas.height = canvas.height;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.left = canvas.offsetLeft + 'px';
    this.overlayCanvas.style.top = canvas.offsetTop + 'px';
    
    const overlayCtx = this.overlayCanvas.getContext('2d');
    if (!overlayCtx) {
      throw new Error('Failed to create 2D context for overlay');
    }
    this.overlayCtx = overlayCtx;
    
    // Append overlay canvas to parent
    if (canvas.parentElement) {
      canvas.parentElement.appendChild(this.overlayCanvas);
    }
  }

  render(registry: Registry, canvas: HTMLCanvasElement, gameState: GameState) {
    const gl = this.gl;

    // Clear
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Collect all renderable entities
    const entities = registry.queryWithIds(Position, Renderable);
    const explosions = registry.queryWithIds(Explosion, Renderable);
    const shipEntities = registry.queryWithIds(Ship, Position);

    const instanceData: {
      positions: number[];
      radii: number[];
      colors: number[];
      opacities: number[];
      rotations: number[];
      shapes: number[];
    } = {
      positions: [],
      radii: [],
      colors: [],
      opacities: [],
      rotations: [],
      shapes: [],
    };

    // Build instance data
    for (const [entityId, position, renderable] of entities) {
      // Check opacity (explosions)
      let opacity = 1;
      for (const [expId, explosion] of explosions) {
        if (expId === entityId) {
          opacity = explosion.getOpacity();
          break;
        }
      }

      // Check rotation (ships)
      let rotation = 0;
      for (const [shipId, ship] of shipEntities) {
        if (shipId === entityId) {
          rotation = ship.rotation;
          break;
        }
      }

      instanceData.positions.push(position.x, position.y);
      instanceData.radii.push(renderable.radius);

      // Parse color
      const color = this.parseColor(renderable.color);
      instanceData.colors.push(color[0], color[1], color[2]);
      instanceData.opacities.push(opacity);
      instanceData.rotations.push(rotation);
      instanceData.shapes.push(renderable.shape === 'circle' ? 0 : 1);
    }

    const instanceCount = instanceData.positions.length / 2;

    if (instanceCount > 0) {
      gl.useProgram(this.program);

      // Set uniforms
      gl.uniform2f(this.locations.resolution, canvas.width, canvas.height);

      // Bind quad vertices
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.enableVertexAttribArray(this.locations.position);
      gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

      // Bind instance data
      this.bindInstanceBuffer(this.instancePositionBuffer, this.locations.instancePosition, 
        new Float32Array(instanceData.positions), 2);
      this.bindInstanceBuffer(this.instanceRadiusBuffer, this.locations.instanceRadius, 
        new Float32Array(instanceData.radii), 1);
      this.bindInstanceBuffer(this.instanceColorBuffer, this.locations.instanceColor, 
        new Float32Array(instanceData.colors), 3);
      this.bindInstanceBuffer(this.instanceOpacityBuffer, this.locations.instanceOpacity, 
        new Float32Array(instanceData.opacities), 1);
      this.bindInstanceBuffer(this.instanceRotationBuffer, this.locations.instanceRotation, 
        new Float32Array(instanceData.rotations), 1);
      this.bindInstanceBuffer(this.instanceShapeBuffer, this.locations.instanceShape, 
        new Float32Array(instanceData.shapes), 1);

      // Draw instances
      if (this.ext) {
        this.ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, instanceCount);
      } else {
        // Fallback: draw each instance separately
        for (let i = 0; i < instanceCount; i++) {
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }
    }

    // Draw damage indicators and UI using 2D canvas overlay
    this.renderOverlay(registry, canvas, gameState);
  }

  private bindInstanceBuffer(buffer: WebGLBuffer, location: number, data: Float32Array, size: number) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    if (this.ext) {
      this.ext.vertexAttribDivisorANGLE(location, 1);
    }
  }

  private parseColor(colorString: string): [number, number, number] {
    // Parse hex color #RRGGBB
    const hex = colorString.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return [r, g, b];
  }

  private renderOverlay(registry: Registry, canvas: HTMLCanvasElement, gameState: GameState) {
    const ctx = this.overlayCtx;
    
    // Clear overlay
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Draw damage indicators
    const damageIndicators = registry.queryWithIds(DamageIndicator, Position);
    for (const [entityId, indicator, position] of damageIndicators) {
      ctx.save();
      ctx.globalAlpha = indicator.getOpacity();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.font = "bold 16px monospace";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.strokeText(`-${indicator.damage}`, position.x, position.y);
      ctx.fillText(`-${indicator.damage}`, position.x, position.y);
      ctx.restore();
    }

    // Draw UI
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px monospace";
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);

    // Player health
    const playerEntities = registry.query(Ship, Health);
    for (const [ship, health] of playerEntities) {
      if (ship.type === "player") {
        ctx.fillText(
          `Health: ${Math.max(0, health.current)}/${health.max}`,
          20,
          60,
        );
        break;
      }
    }
    ctx.restore();
  }
}

export function createGPURenderer(canvas: HTMLCanvasElement): GPURenderer {
  return new GPURenderer(canvas);
}
