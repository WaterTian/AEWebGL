const Script = require('./Script').default;

export default class TimeLine {
  constructor() {


    this.cameraScript = new Script();

  }


  getValues(script,t)
  {
    var v = {};
    script.updateValues(t, v);
    return v;
  }
}