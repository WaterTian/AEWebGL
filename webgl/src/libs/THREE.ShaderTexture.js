const THREE = require('three');


export default class ShaderTexture {
	constructor(renderer, shader, width, height, format, type, minFilter, magFilter, wrapS, wrapT) {

		this.renderer = renderer;
		this.shader = shader;
		this.orthoScene = new THREE.Scene();
		this.fbo = new THREE.WebGLRenderTarget(width, height, {
			wrapS: wrapS || THREE.RepeatWrapping,
			wrapT: wrapT || THREE.RepeatWrapping,
			minFilter: minFilter || THREE.LinearMipMapLinearFilter,
			magFilter: magFilter || THREE.LinearFilter,
			format: format || THREE.RGBAFormat,
			type: type || THREE.UnsignedByteType
		});
		this.orthoCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, .00001, 1000);
		const geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array([-1.0, -1.0, 0.0,
			3.0, -1.0, 0.0, -1.0, 3.0, 0.0,
		]);
		const uvs = new Float32Array([
			0.0, 0.0,
			2.0, 0.0,
			0.0, 2.0,
		]);
		geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
		geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));

		this.orthoQuad = new THREE.Mesh(geometry, this.shader);
		this.orthoQuad.scale.set(width, height, 1.);
		this.orthoScene.add(this.orthoQuad);
		this.texture = this.fbo.texture;

	}

	render(final) {
		this.renderer.render(this.orthoScene, this.orthoCamera, final ? null : this.fbo);
	}

	setSize(width, height) {

		this.orthoQuad.scale.set(width, height, 1.);

		this.fbo.setSize(width, height);

		this.orthoQuad.scale.set(width, height, 1);

		this.orthoCamera.left = -width / 2;
		this.orthoCamera.right = width / 2;
		this.orthoCamera.top = height / 2;
		this.orthoCamera.bottom = -height / 2;
		this.orthoCamera.updateProjectionMatrix();
	}
}