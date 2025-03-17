export interface KeyEvent {
    keycode: number;
    type: "keydown";
    altKey: true;
    shiftKey: true;
    ctrlKey: false;
    metaKey: false;
}

export interface Key {
    keycode: number;
    altKey: boolean;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}
