FoX = (function () {
    const SVGGlobalArray = ["circle", "defs", "elipse", "g", "line", "path", "pattern", "polygon", "rect", "svg", "text", "textPath", "title", "tspan"];

    const Namespace = {
        ns: 'http://www.w3.org/2000/svg',
        att: 'http://www.mozilla.org/ns/specialspace'
    };

    const Init = function() {
    }

    function Inherit (Target, Parent, Subset = []) {
        Object.assign(Target.prototype, ((Subset.length !== 0) ? Subset.reduce(function(o, k) { o[k] = Parent.prototype[k]; return o; }, {}) : Parent.prototype ));
    };

    function extend(Parent) {
        const Methods = [].slice.call(arguments).pop();
        for (var Key in Methods) if (Methods.hasOwnProperty(Key)) Parent.prototype[Key] = Methods[Key];
    }

    function ToUpperCase(Text) {
        return Text.replace(/^\w/, c => c.toUpperCase());
    }

    function TagName(Element) {
        return ToUpperCase(Element.tagName);
    }

    function GetParameters(Func) {
        const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
        const ARGUMENT_NAMES = /([^\s,]+)/g;

        const FunctionString = Func.toString().replace(STRIP_COMMENTS, '');
        const Result = FunctionString.slice(FunctionString.indexOf('(')+1, FunctionString.indexOf(')')).match(ARGUMENT_NAMES);
        return (Result === null) ? Result = [] : Result;
    }

    function ParametrsSetter(Parameters, Type) {
        const Element = (typeof Type === "string") ? document.createElementNS(Namespace.ns, Type) : Type;

        for (let i in Parameters) {
            (Parameters[i] !== undefined && (typeof Parameters[i] === 'number' || Parameters[i] instanceof Array)) ? Element.setAttributeNS(Namespace.ns, i, ( (Array.isArray(Parameters[i])) ? Parameters[i].join(" ") : Parameters[i]) ) : null;
        }
        return Element;
    }

    function CallParametersSetter(Func, arg, el) {
        const AttrArray = [];
        const ParametersNames = GetParameters(Func);

        for(let i = 0; i < arg.length; i++) { AttrArray[ParametersNames[i]] = arg[i]; }
        return ParametrsSetter(AttrArray, el);
    }

    Init.prototype.HTML = function(Selector) {
        const HTMLElements = document.querySelectorAll(Selector);
        const HTMLArray = [].slice.call(HTMLElements);

        for(let i = 0; i < HTMLArray.length; i++) {
            if(HTMLArray[i] instanceof SVGElement || SVGGlobalArray.includes(HTMLArray[i].tagName)) {
                HTMLArray.splice(i);
            }
        }
        return new HTMLInitialize(HTMLArray);
    }

    Init.prototype.SVG = function(Selector) {
        const SVGElements = document.querySelectorAll(Selector);
        const SVGArray = [].slice.call(SVGElements);

        for(let i = 0; i < SVGArray.length; i++) {
            if(SVGArray[i] instanceof HTMLElement) {
                SVGArray.splice(i);
            }
        }
        return new SVGInitialize(SVGArray);
    }

    Init.prototype.GET = function(Selector) {
        switch (Selector) {
            case window:
                return new HTMLInitialize([window]);
            break;
            case document:
                return new HTMLInitialize([document]);
            break;
            default:
                return (Selector instanceof SVGElement) ? new SVGInitialize([Selector]) : new HTMLInitialize([Selector]);
        }
        return this;
    };

    Init.prototype.Create = {
        Rect: function({ Element, width, height }={}) {
            return (Element !== undefined && Element instanceof SVGElement) ? new Rect(Element) : new Rect(ParametrsSetter(arguments[0], "rect"));
        },
        Circle: function( r = null, { Element }={}) {
            return (Element !== undefined && Element instanceof SVGElement) ? new Circle(Element) : new Circle(CallParametersSetter(this.Circle, arguments, "circle"));
        },
        G: function({ Element }={}) {
            return (Element !== undefined && Element instanceof SVGElement) ? new Group(Element) : new Group(ParametrsSetter(arguments[0], "g"));
        },
        Svg: function({ Element, width, height, viewBox=[], x, y}={}) {
            return (Element !== undefined && Element instanceof SVGElement) ? new Svg(Element) : new Svg(ParametrsSetter(arguments[0], "svg"));
        },
        Path: function( d = [], { Element }={}) {
            return (Element !== undefined && Element instanceof SVGElement) ? new Path(Element) : new Path(CallParametersSetter(this.Path, arguments, "path"));
        },
        Element: function(Element) {
            Element = ToUpperCase(Element);
            return (Object.getOwnPropertyNames(this).includes(Element)) ? new this[Element](ParametrsSetter(arguments[0], Element)) : new HTML(document.createElement(Element));
        }
    }

    //////////////////////////
    /////////  INIT  /////////
    //////////////////////////
    const Initialize = function(Elements) {
        this.HTMLMembers = [];
        this.SVGMembers = [];
        const Instances = Object.getOwnPropertyNames(this);

        for(let x = 0; x < Elements.length; x++) {
            (Elements[x] instanceof SVGElement) ? this.SVGMembers.push(new SVG(Elements[x])) : this.HTMLMembers.push(new HTML(Elements[x]));
        }
        for(let i = 0; i < Instances.length; i++) if (this[Instances[i]].length === 0) delete this[Instances[i]];
        return this;
    }

    Initialize.prototype.get = function(i) { //Nefunguje pokud mám v poli dva objekty, které nejsou řazeny číselně. Jsou v asociativním poli. [Vybrání SVG a HTML zároveň]
        return this[Object.getOwnPropertyNames(this)][i];
    }

    Initialize.prototype.each = function(callback) {
        if(!callback || typeof callback !== 'function') return;
        const Instances = Object.getOwnPropertyNames(this);

        for(let y = 0; y < Instances.length; y++) {
            for(let i = 0; i < this[Instances[y]].length; i++) {
                callback(this[Instances[y]][i].Element, i);
            };
        }
        return this;
    }

    Initialize.prototype.attr = function(name, setter) {
        if(setter === null || setter === undefined) {
            return ((this instanceof SVG || this instanceof HTML) ? this : (this[Object.getOwnPropertyNames(this)[0]][0])).Element.getAttribute(name);
        } else {
            (this instanceof SVG || this instanceof HTML) ? this.node().setAttribute(name, setter) : (this.each(function(item){ item.setAttribute(name, setter); }));
        }
        return this
    }

    Initialize.prototype.Parent = function(selector) { //Nefunguje přesný parent. Pouze první nadřazený!!!!!! //
        if(selector === null || selector === undefined) {
            const Parent = ((this instanceof SVG || this instanceof HTML) ? this : this[Object.getOwnPropertyNames(this)[0]][0]).Element.parentElement;
            return (Parent instanceof SVGElement) ? new SVGInitialize([Parent]) : new HTMLInitialize([Parent]);
        } else {
            const Parent = [];

            this.each(function(Element) {
                return (!Parent.includes(Element.parentNode)) ? ((Element.parentNode.matches(selector)) ? Parent.push(Element.parentNode) : null ) : null;
            });
            return (Parent instanceof SVGElement) ? new SVGInitialize(Parent) : new HTMLInitialize(Parent);
        }
        return this;
    }

    // Initialize.prototype.After = function(Selector) {
    //     this.Element.parentNode.insertBefore(Selector.Element, this.Element.nextSibling);
    // }
    //
    // Initialize.prototype.Before = function(Selector) {
    //     this.Element.parentNode.insertBefore(Selector.Element, this.Element);
    // }
    //
    // Initialize.prototype.Add = function(Selector) {
    //     this.Element.appendChild(Selector.Element);
    // }

    const HTMLInitialize = function(Elements) {
        this.HTMLMembers = [];

        if (Elements.length === 1) {
            return (Elements[0] instanceof HTMLElement || Document || Window) ? new HTML(Elements[0]) : null;
        } else { for(let x = 0; x < Elements.length; x++) { this.HTMLMembers.push(new HTML(Elements[x])) } }
        return this;
    }
    Inherit(HTMLInitialize, Initialize);

    const SVGInitialize = function(Elements) {
        this.SVGMembers = [];

        if(Elements.length === 1) {
            return (Elements[0] instanceof SVGElement) ? FoX.Create[TagName(Elements[0])]({Element: Elements[0]}) : null;
        } else { for(let x = 0; x < Elements.length; x++) { this.SVGMembers.push(new SVG(Elements[x])); } }
    }
    Inherit(SVGInitialize, Initialize);

    SVGInitialize.prototype.Fill = function() {

    }

    /////////////////////////////
    /////////  ELEMENT  /////////
    /////////////////////////////
    const ElementInit = function(Elements) {
        this.Element = Elements;
        this.type = Elements.tagName || Elements.constructor.name;
        return this;
    }
    Inherit(ElementInit, Initialize, ["attr", "Parent"]);

    ElementInit.prototype.node = function() {
        return this.Element;
    }

    ElementInit.prototype.Child = function(selector) {
        if(selector === null || selector === undefined) {
            return new Initialize([].slice.call(this.Element.children));
        } else {
            return new Initialize(Array.prototype.filter.call(this.Element.children, function(child){
                return child.matches(selector);
            }));
        }
        return this;
    }

    ElementInit.prototype.BBox = function() {
        const GetBox = this.Element.getBBox();
        const GetRect = this.Element.getBoundingClientRect();

        const Coordinates = {
            w: GetBox.width,
            h: GetBox.height,
            x: GetBox.x,
            y: GetBox.y,
            x2: GetRect.x,
            y2: GetRect.y
        }
        return Coordinates;
    }

    // ElementInit.prototype.Next = function() {
    //     const Element = this.Element.nextElementSibling;
    //     return (Element instanceof SVGElement) ? new FoX.Create[TagName(Element)] : new HTML(Element);
    // }
    //
    // ElementInit.prototype.Prev = function() {
    //     const Element = this.Element.previousElementSibling;
    //     return (Element instanceof SVGElement) ? new FoX.Create[TagName(Element)] : new HTML(Element);
    // }

    ElementInit.prototype.on = function(event, callback) {
        if(!callback || typeof callback !== 'function') return;
        const Element = this;

        if(Element === document) {
            return Element.eventHandler.bindEvent(event, callback, Element);
        } else if (Array.isArray(Element.Element)) {
            this.each(function(item) {
                return Element.eventHandler.bindEvent(event, callback, item);
            });
        } else {
            return Element.eventHandler.bindEvent(event, callback, Element.Element);
        }
        return this;
    }

    ElementInit.prototype.off = function(event, callback) {
        if(!callback || typeof callback !== 'function') return;
        const Element = this;

        if(Array.isArray(Element.Element)) {
            this.each(function(item) {
                return Element.eventHandler.unbindEvent(event, item);
            });
        } else {
            return Element.eventHandler.unbindEvent(event, Element.Element);
        }
        return this;
    }

    ElementInit.prototype.eventHandler = {
        events: [],
        bindEvent: function(event, callback, targetElement) {
            this.unbindEvent(event, targetElement);
            targetElement.addEventListener(event, callback, false);

            this.events.push({
                type: event,
                event: callback,
                target: targetElement
            });
            return (targetElement instanceof SVGElement) ? new SVGInitialize([targetElement]) : new HTMLInitialize([targetElement]);
        },
        findEvent: function(event) {
            return this.events.filter(function(evt) {
                return (evt.type === event);
            }, event)[0];
        },
        unbindEvent: function(event, targetElement) {
            const foundEvent = this.findEvent(event);

            if (foundEvent !== undefined) {
                targetElement.removeEventListener(event, foundEvent.event, false);
            }
            this.events = this.events.filter(function(evt) {
                return (evt.type !== event);
            }, event);
            return (targetElement instanceof SVGElement) ? new SVGInitialize([targetElement]) : new HTMLInitialize([targetElement]);
        }
    };

    //////////////////////////
    /////////  HTML  /////////
    //////////////////////////
    const HTML = function(Elements) {
        ElementInit.apply(this, arguments);
    }
    Inherit(HTML, ElementInit);

    //////////////////////////
    /////////  SVG  //////////
    //////////////////////////
    const SVG = function(Elements) {
        ElementInit.apply(this, arguments);
    }
    Inherit(SVG, ElementInit);
    Inherit(SVG, SVGInitialize);

    //////////////////////////////////
    /////////  SVG ELEMENTS  /////////
    //////////////////////////////////

    /*---------------   RECT   -------------------*/
    const Rect = function(Element) {
        ElementInit.apply(this, arguments);
    }
    Inherit(Rect, SVG);


    Rect.prototype.Size = function(width, height) {
        CallParametersSetter(this.Size, arguments, this.Element);
        return this;
    }

    /*---------------   CIRCLE   -------------------*/
    const Circle = function(Element) {
        ElementInit.apply(this, arguments);
    }
    Inherit(Circle, ElementInit);

    Circle.prototype.Radius = function(r) {
        CallParametersSetter(this.Radius, arguments, this.Element);
        return this;
    }

    Circle.prototype.Cx = function(cx) {
        CallParametersSetter(this.Cx, arguments, this.Element);
        return this;
    }

    Circle.prototype.Cy = function(cy) {
        CallParametersSetter(this.Cy, arguments, this.Element);
        return this;
    }

    /*---------------   SVG   -------------------*/
    const Svg = function(Element) {
        ElementInit.apply(this, arguments);
        Element.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        Element.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    }
    Inherit(Svg, ElementInit);

    Svg.prototype.Viewbox = function({x, y, w, h}={}) {
        CallParametersSetter(this.Viewbox, arguments[0], this.Element);
        return this;
    }

    /*---------------   GROUP   -------------------*/
    const Group = function(Element) {
        ElementInit.apply(this, arguments);
    }
    Inherit(Group, ElementInit);

    Group.prototype.Add = function(){};

    /*---------------   PATH   -------------------*/
    const Path = function(Element) {
        ElementInit.apply(this, arguments);
    }

    Path.prototype.M = function({x,y}) { //Absolute
        
    }

    Path.prototype.m = function({x,y}) { //Relative

    }

    Path.prototype.L = function({x,y}) { //Absolute

    }

    Path.prototype.l = function({x,y}) { //Relative

    }

    Path.prototype.H = function({x}) { //Absolute

    }

    Path.prototype.h = function({x}) { //Relative

    }

    Path.prototype.V = function({x}) { //Absolute

    }

    Path.prototype.v = function({x}) { //Relative

    }

    //////////////////////////////////
    ///////////  INSTANCE  ///////////
    //////////////////////////////////

    const Instance = function() {
        return new Init();
    }
    return Instance();
})();
