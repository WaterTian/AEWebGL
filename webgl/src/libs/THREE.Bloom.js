const THREE = require('three');
const glslify = require('glslify');


export default class Bloom {
  constructor(levels,baseFBO) {

    this.levels = levels !== undefined ? levels : 5;
    this.baseFBO = baseFBO;
    this.fbos = [];
    this.fbo = this.createFBO();
    this.fbos.push(this.createFBO());

    for (var j = 0; j < this.levels; j++) {
      var fbo = this.createFBO();
      this.fbos.push(fbo);
      var fbo = this.createFBO();
      this.fbos.push(fbo);
    }
    this.fbos.push(this.createFBO());

    this.width = 512;
    this.height = 512;


    this.highlightShader = new THREE.RawShaderMaterial({
      uniforms: {
        source: {
          value: null
        },
        threshold: {
          value: 1.
        }
      },
      vertexShader: glslify('../glsl/ortho.vert'),
      fragmentShader: glslify('../glsl/highlight.frag'),
    });

    this.blurShader = new THREE.RawShaderMaterial({
      uniforms: {
        source: {
          value: null
        },
        resolution: {
          value: new THREE.Vector2(1, 1)
        },
        delta: {
          value: new THREE.Vector2(0, 1)
        }
      },
      vertexShader: glslify('../glsl/ortho.vert'),
      fragmentShader: glslify('../glsl/blur.frag'),
    });

    this.bloomShader = new THREE.RawShaderMaterial({
      uniforms: {
        levels: {
          value: this.levels
        },
        base: {
          value: this.baseFBO.texture
        },
        level0: {
          value: this.levels > 0 ? this.fbos[2].texture : null
        },
        level1: {
          value: this.levels > 1 ? this.fbos[4].texture : null
        },
        level2: {
          value: this.levels > 2 ? this.fbos[6].texture : null
        },
        level3: {
          value: this.levels > 3 ? this.fbos[8].texture : null
        },
        level4: {
          value: this.levels > 4 ? this.fbos[10].texture : null
        },
        resolution: {
          value: new THREE.Vector2(1, 1)
        },
        boost: {
          value: 1.1
        },
        reduction: {
          value: 1.1
        },
        amount: {
          value: 0
        },
        time: {
          value: 0
        },
      },
      vertexShader: glslify('../glsl/ortho.vert'),
      fragmentShader: glslify('../glsl/bloom.frag'),
    });

    this.orthoScene = new THREE.Scene();
    this.orthoCamera = new THREE.OrthographicCamera(1 / -2, 1 / 2, 1 / 2, 1 / -2, .00001, 1000);

    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([-1.0, -1.0, 0.0,
      3.0, -1.0, 0.0, -1.0, 3.0, 0.0,
    ]);
    var uvs = new Float32Array([
      0.0, 0.0,
      2.0, 0.0,
      0.0, 2.0,
    ]);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    this.orthoQuad = new THREE.Mesh(geometry, this.highlightShader);

    this.orthoScene.add(this.orthoQuad);

  }

  createFBO() {
    var fbo = new THREE.WebGLRenderTarget(1, 1, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false,
      depthBuffer: false
    });

    fbo.texture.generateMipMaps = false;
    return fbo;
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;

    var tw = w;
    var th = h;

    this.fbo.setSize(tw, th);

    this.fbos[0].setSize(tw, th);

    tw /= 2;
    th /= 2;
    tw = Math.round(tw);
    th = Math.round(th);

    for (var j = 1; j < this.levels * 2; j += 2) {
      this.fbos[j].setSize(tw, th);
      this.fbos[j + 1].setSize(tw, th);
      tw /= 2;
      th /= 2;
      tw = Math.round(tw);
      th = Math.round(th);
    }
  }
  setRenderSize(width, height) {
    this.orthoQuad.scale.set(width, height, 1.);

    this.orthoCamera.left = -width / 2;
    this.orthoCamera.right = width / 2;
    this.orthoCamera.top = height / 2;
    this.orthoCamera.bottom = -height / 2;
    this.orthoCamera.updateProjectionMatrix();
  }


  render(renderer) {

    this.highlightShader.uniforms.source.value = this.baseFBO.texture;
    var w = this.fbos[0].width;
    var h = this.fbos[0].height;
    this.orthoQuad.material = this.highlightShader;
    this.setRenderSize(w, h);
    renderer.render(this.orthoScene, this.orthoCamera, this.fbos[0]);


    var v = 1;

    for (var j = 1; j < this.levels * 2; j += 2) {

      this.orthoQuad.material = this.blurShader;
      this.orthoQuad.material.uniforms.delta.value.set(v, 0);
      this.orthoQuad.material.uniforms.source.value = this.fbos[j - 1].texture;
      this.orthoQuad.material.uniforms.resolution.value.set(this.fbos[j].width, this.fbos[j].height);
      this.setRenderSize(this.fbos[j].width, this.fbos[j].height);
      renderer.render(this.orthoScene, this.orthoCamera, this.fbos[j]);

      this.orthoQuad.material = this.blurShader;
      this.orthoQuad.material.uniforms.delta.value.set(0, v);
      this.orthoQuad.material.uniforms.source.value = this.fbos[j].texture;
      this.orthoQuad.material.uniforms.resolution.value.set(this.fbos[j + 1].width, this.fbos[j + 1].height);
      this.setRenderSize(this.fbos[j + 1].width, this.fbos[j + 1].height);
      renderer.render(this.orthoScene, this.orthoCamera, this.fbos[j + 1]);

    }

    this.orthoQuad.material = this.bloomShader;
    this.orthoQuad.material.uniforms.amount.value = .01;
    this.orthoQuad.material.uniforms.time.value = .001 * performance.now();
    this.orthoQuad.material.uniforms.resolution.value.set(this.width, this.height);
    this.setRenderSize(this.width, this.height);
    renderer.render(this.orthoScene, this.orthoCamera, this.fbo);

  }
}