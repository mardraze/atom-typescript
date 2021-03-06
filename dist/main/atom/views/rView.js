"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var atomUtils_1 = require("../atomUtils");
var sp = require("atom-space-pen-views");
var React = require("react");
var MyComponent = (function (_super) {
    __extends(MyComponent, _super);
    function MyComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { count: 0 };
        _this.stop = function () {
            clearInterval(_this.interval);
        };
        return _this;
    }
    MyComponent.prototype.componentDidMount = function () {
        var _this = this;
        this.interval = setInterval(function () {
            _this.setState({ count: _this.state.count + 1 });
        });
    };
    MyComponent.prototype.render = function () {
        return React.createElement("div", { onClick: this.stop },
            "This is a test: ",
            this.state.count);
    };
    return MyComponent;
}(React.Component));
MyComponent.defaultProps = { count: 0 };
var RView = (function (_super) {
    __extends(RView, _super);
    function RView(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        _this.getURI = function () { return atomUtils_1.uriForPath(_this.constructor.protocol, _this.config.filePath); };
        _this.getTitle = function () { return _this.config.title; };
        _this.getIconName = function () { return _this.config.icon; };
        React.render(React.createElement(MyComponent, {}), _this.rootDomElement);
        return _this;
    }
    Object.defineProperty(RView.prototype, "rootDomElement", {
        get: function () {
            return this.mainContent[0];
        },
        enumerable: true,
        configurable: true
    });
    RView.content = function () {
        var _this = this;
        return this.div({ class: 'atomts atomts-r-view native-key-bindings' }, function () {
            _this.div({ outlet: 'mainContent layout' });
        });
    };
    Object.defineProperty(RView.prototype, "$", {
        get: function () { return this; },
        enumerable: true,
        configurable: true
    });
    return RView;
}(sp.ScrollView));
exports.RView = RView;
RView.protocol = 'atomtsview:';
