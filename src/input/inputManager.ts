export class InputManager {
  public heldKeys = new Set<string>();
  public justPressedKeys = new Set<string>();
  public joystickX = 0;
  public joystickY = 0;
  public mouseNdcX = 0;
  public mouseNdcY = 0;
  public cursorWorldX = 0;
  public cursorWorldZ = 0;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onBlurBound: () => void;

  constructor() {
    this.onKeyDownBound = (e: KeyboardEvent) => {
      if (!this.heldKeys.has(e.code)) {
        this.justPressedKeys.add(e.code);
      }
      this.heldKeys.add(e.code);
    };

    this.onKeyUpBound = (e: KeyboardEvent) => {
      this.heldKeys.delete(e.code);
    };

    this.onBlurBound = () => {
      this.heldKeys.clear();
      this.justPressedKeys.clear();
      this.joystickX = 0;
      this.joystickY = 0;
    };

    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('blur', this.onBlurBound);
  }

  public consumeJustPressed(code: string): boolean {
    if (this.justPressedKeys.has(code)) {
      this.justPressedKeys.delete(code);
      return true;
    }
    return false;
  }

  public endFrame() {
    this.justPressedKeys.clear();
  }

  public setVirtualJoystick(dx: number, dy: number) {
    this.joystickX = dx;
    this.joystickY = dy;
  }

  public dispose() {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('blur', this.onBlurBound);
  }
}
