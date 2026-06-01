(function (global) {
    "use strict";

    if (typeof global !== "object" || !global) {
        throw new Error("Widget requires a window");
    }

    if (typeof global.Widget !== "undefined") {
        throw new Error("Widget is already defined");
    }

    // @CODE

    global.Widget = Widget;

})(typeof window !== "undefined" ? window : this);
