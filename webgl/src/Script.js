export default class Script {
  constructor() {
    this.keyframes = [];
  }

  updateValues(t, scope) {
    var id = this.findKeyframe(t);
    var k = this.keyframes[id];
    var nk = this.keyframes[id + 1];
    var dt = (t - k.time) / (nk.time - k.time);
    dt = cubicInOut(dt);
    for (var j in k.vars) {
      scope[j] = k.vars[j] + dt * (nk.vars[j] - k.vars[j]);
    }

    function cubicIn(t) {
      return Math.pow(t, 3);
    }

    function cubicOut(t) {
      return 1 - cubicIn(1 - t);
    }

    function cubicInOut(t) {
      if (t < .5) return cubicIn(t * 2) / 2;
      else return 1 - cubicIn((1 - t) * 2) / 2;
    }

    function easeOutElastic(t) {
      var p = 1.;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }

  }

  findKeyframe(t) {
    for (var j = 0; j < this.keyframes.length; j++) {
      if (t < this.keyframes[j].time) {
        return j - 1;
      }
    }
  }

  addKeyframe(vars, time) {
    this.keyframes.push({
      vars: vars,
      time: time
    })
  }
  
}