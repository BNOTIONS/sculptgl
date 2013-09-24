SculptGL.prototype.onLeapIn = function(event) {
    if(!event) return;
    this.gui_.ctrlNegative_.setValue(event.negative);
    var mouseX = event.pageX,
      mouseY = event.pageY;
    this.mouseButton_ = event.which;
    var button = event.which;
    var pressureRadius = 1;
    var pressureIntensity = event.pressureIntensity;
    if (button === 1)
    {
      if (this.mesh_)
      {
        this.sumDisplacement_ = 0;
        this.states_.start();
        if (this.sculpt_.tool_ === Sculpt.tool.ROTATE)
          this.sculpt_.startRotate(this.picking_, mouseX, mouseY, this.pickingSym_, this.ptPlane_, this.nPlane_, this.symmetry_);
        else if (this.sculpt_.tool_ === Sculpt.tool.SCALE)
          this.sculpt_.startScale(this.picking_, mouseX, mouseY, this.pickingSym_, this.ptPlane_, this.nPlane_, this.symmetry_);
        else if (this.continuous_ && this.sculpt_.tool_ !== Sculpt.tool.DRAG)
        {
          this.pressureRadius_ = pressureRadius;
          this.pressureIntensity_ = pressureIntensity;
          this.mouseX_ = mouseX;
          this.mouseY_ = mouseY;
          var self = this;
          this.sculptTimer_ = setInterval(function ()
          {
            self.sculpt_.sculptStroke(self.mouseX_, self.mouseY_, self.pressureRadius_, self.pressureIntensity_, self);
            self.render();
          }, 20);
        } else {
          this.sculpt_.sculptStroke(mouseX, mouseY, pressureRadius, pressureIntensity, this);
        }
      }
    }
    else if (button === 3)
    {
      if (this.camera_.usePivot_)
        this.picking_.intersectionMouseMesh(this.mesh_, mouseX, mouseY, pressureRadius);
      this.camera_.start(mouseX, mouseY, this.picking_);
    }
}

SculptGL.prototype.onLeapMove = function(event) {
    if(!event) return;

    this.gui_.ctrlNegative_.setValue(event.negative);
    var mouseX = event.pageX,
      mouseY = event.pageY;
    var button = this.mouseButton_;
    var tool = this.sculpt_.tool_;
    var pressureRadius = 1;
    var pressureIntensity = event.pressureIntensity;
    if (this.continuous_ && this.sculptTimer_ !== -1)
    {
      this.pressureRadius_ = pressureRadius;
      this.pressureIntensity_ = pressureIntensity;
      this.mouseX_ = mouseX;
      this.mouseY_ = mouseY;
      return;
    }
    if (this.mesh_ && (button !== 1 || (tool !== Sculpt.tool.ROTATE && tool !== Sculpt.tool.DRAG && tool !== Sculpt.tool.SCALE)))
      this.picking_.intersectionMouseMesh(this.mesh_, mouseX, mouseY, pressureRadius);
    if (button === 1)
    {
      this.sculpt_.sculptStroke(mouseX, mouseY, pressureRadius, pressureIntensity, this);
      this.gui_.updateMeshInfo(this.mesh_.vertices_.length, this.mesh_.triangles_.length);
    }
    else if (button === 3)
      this.camera_.rotate(mouseX, mouseY);
    else if (button === 2)
      this.camera_.translate((mouseX - this.lastMouseX_) / 3000, (mouseY - this.lastMouseY_) / 3000);
    this.lastMouseX_ = mouseX;
    this.lastMouseY_ = mouseY;
    this.render();
}

SculptGL.prototype.onLeapOut = function() {
    if (this.mesh_)
      this.mesh_.checkLeavesUpdate();
    if (this.sculptTimer_ !== -1)
    {
      clearInterval(this.sculptTimer_);
      this.sculptTimer_ = -1;
    }
    this.mouseButton_ = 0;
    has_hand = false;
}

var lev = new Levitate();
var has_hand = false;
lev.on("hand:new", function(id, hand){
    if(has_hand)return;
    has_hand = true;
    sculptgl.onLeapIn(map_frame(hand));

    lev.on("hand:" + id + ":frame", function(hand){
        var e = map_frame(hand);
        if(e) {
            sculptgl.onLeapMove(e);
        }
    });

    lev.on("hand:" + id + ":remove", function(){
        sculptgl.onLeapOut();
        has_hand = false;
        lev.off("hand:" + id + ":frame");
        lev.off("hand:" + id + ":remove");
    });

});

var map_frame = function(hand) {
    var tracked;
    if(hand.frame.fingers) {
        tracked = hand.getExtendedFinger().tipPosition;
    } else {
        tracked = hand.frame.palmPosition;
    }

    if(!tracked || tracked.length < 3) return false;

    var palm_x = tracked[0];
    var px = palm_x + 150;
    if(px < 0 || px > 300) return;
    var palm_y = tracked[1];
    var palm_z = tracked[2];
    var py = palm_y / 500;
    var pz = Math.abs(palm_z / 200);
    var px = px / 300;

    var pnorm = (py - 1) * -1;

    var norm_x = Math.floor(window.document.width * px);
    var norm_y = Math.floor(window.document.height * pnorm);

    var is_negative = (palm_z < 0) ? true : false;

    return event = {
        pageX: norm_x,
        pageY: norm_y,
        pressureIntensity: pz,
        which: 1,
        negative: is_negative
    }
};

var leap_controller = new Leap.Controller();

leap_controller.on('animationFrame', function(frame) {
  lev.handleFrame(frame);
});

leap_controller.connect();
