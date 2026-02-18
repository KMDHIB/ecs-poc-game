/// <reference types="@webgpu/types" />
import { define, StoreElement } from "@flemminghansen/wc-store";

define(
  "shader-fun2",
  class extends StoreElement {
    #canvas = document.createElement("canvas");
    #device: GPUDevice | null = null;
    #context: GPUCanvasContext | null = null;
    #pipeline: GPURenderPipeline | null = null;
    #uniformBuffer: GPUBuffer | null = null;
    #bindGroup: GPUBindGroup | null = null;
    #animationId: number | null = null;
    #startTime = Date.now();

    // WGSL Shader Code
    #shaderCode = `
        struct Uniforms {
            time: f32,
            resolution: vec2<f32>,
        };
        
        @group(0) @binding(0) var<uniform> uniforms: Uniforms;
        
        @vertex
        fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {

            var pos = array<vec2<f32>, 3>(
                vec2<f32>(-1.0, -1.0),
                vec2<f32>(3.0, -1.0),
                vec2<f32>(-1.0, 3.0)
            );
            return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
        }
        
        @fragment
        fn fragmentMain(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
            // Normalize coordinates to 0-1
            let uv = fragCoord.xy / uniforms.resolution;
            
            let time = uniforms.time;
            
            // Center coordinates (0 at center, ranging from -0.5 to 0.5)
            let centered = uv - 0.5;
            
            // Calculate distance from center
            let dist = length(centered);
            
            // Calculate angle for rotation effects
            let angle = atan2(centered.y, centered.x);
            
            // Radial wave pattern - ripples emanating from center
            let ripple = sin(dist * 20.0 - time * 2.0) * 0.5 + 0.5;
            
            // Rotating spiral pattern
            let spiral = sin(dist * 10.0 + angle * 3.0 - time) * 0.5 + 0.5;
            
            // Pulsing circle
            let pulse = sin(dist * 15.0 - time * 3.0) * 0.5 + 0.5;
            
            // Color based on radial patterns
            let r = ripple;
            let g = spiral;
            let b = pulse;
            
            // White gradient from center (0.0 = full white at center, fades out)
            let centerGradient = 1.0 - smoothstep(0.0, 0.3, dist);
            
            // Mix the radial colors with white gradient
            let finalColor = mix(vec3<f32>(r, g, b), vec3<f32>(1.0, 1.0, 1.0), centerGradient);
            
            return vec4<f32>(finalColor, 1.0);
        }

    `;

    async connectedCallback() {
      this.style.height = "100%";
      this.appendChild(this.#canvas);
      this.#canvas.style.width = "100%";
      this.#canvas.style.height = "100%";
      this.#canvas.style.display = "block";
      this.#canvas.style.opacity = "0.3";
      await this.#initWebGPU();
      this.#render();
    }

    disconnectedCallback() {
      if (this.#animationId !== null) {
        cancelAnimationFrame(this.#animationId);
      }
    }

    async #initWebGPU() {
      // Check for WebGPU support
      if (!navigator.gpu) {
        this.#canvas.style.backgroundColor = "#ff0000";
        console.error("WebGPU not supported");
        return;
      }

      // Get GPU adapter and device
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error("No GPU adapter found");
        return;
      }

      this.#device = await adapter.requestDevice();

      // Configure canvas context
      this.#context = this.#canvas.getContext(
        "webgpu",
      ) as unknown as GPUCanvasContext;
      if (!this.#context) {
        console.error("Could not get WebGPU context");
        return;
      }

      const format = navigator.gpu.getPreferredCanvasFormat();
      this.#canvas.width = this.clientWidth || 800;
      this.#canvas.height = this.clientHeight || 600;

      this.#context.configure({
        device: this.#device,
        format: format,
        alphaMode: "opaque",
      });

      // Create shader module
      const shaderModule = this.#device.createShaderModule({
        code: this.#shaderCode,
      });

      // Create uniform buffer
      this.#uniformBuffer = this.#device.createBuffer({
        size: 16, // 4 bytes (time) + 8 bytes (resolution) + 4 bytes padding
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      // Create bind group layout
      const bindGroupLayout = this.#device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" },
          },
        ],
      });

      // Create bind group
      this.#bindGroup = this.#device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: this.#uniformBuffer },
          },
        ],
      });

      // Create pipeline
      this.#pipeline = this.#device.createRenderPipeline({
        layout: this.#device.createPipelineLayout({
          bindGroupLayouts: [bindGroupLayout],
        }),
        vertex: {
          module: shaderModule,
          entryPoint: "vertexMain",
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fragmentMain",
          targets: [
            {
              format: format,
            },
          ],
        },
        primitive: {
          topology: "triangle-list",
        },
      });
    }

    #render = () => {
      if (
        !this.#device ||
        !this.#context ||
        !this.#pipeline ||
        !this.#uniformBuffer ||
        !this.#bindGroup
      ) {
        return;
      }

      // Update uniforms
      const time = (Date.now() - this.#startTime) / 1000;
      const uniformData = new Float32Array([
        time,
        0, // padding
        this.#canvas.width,
        this.#canvas.height,
      ]);
      this.#device.queue.writeBuffer(this.#uniformBuffer, 0, uniformData);

      // Create command encoder
      const commandEncoder = this.#device.createCommandEncoder();
      const textureView = this.#context.getCurrentTexture().createView();

      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });

      renderPass.setPipeline(this.#pipeline);
      renderPass.setBindGroup(0, this.#bindGroup);
      renderPass.draw(3); // Draw full screen triangle
      renderPass.end();

      this.#device.queue.submit([commandEncoder.finish()]);

      // Continue animation
      this.#animationId = requestAnimationFrame(this.#render);
    };
  },
);
