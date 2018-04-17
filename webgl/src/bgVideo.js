

export default class bgVideo {
	constructor() {


		this.video = document.getElementById('video');
		// this.video.setAttribute("style", "display:none;");
		this.video.setAttribute('playsinline', true);
		this.video.setAttribute('webkit-playsinline', true);

		this.video.loop = true;
		this.video.muted = true;
		this.video.src = 'assets/2.mp4';

		this.video.play();

		this.width= this.video.width;

		return this.video;
	}


}