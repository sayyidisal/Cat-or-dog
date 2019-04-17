import * as React from "react";
import {Animated, Dimensions} from "react-native";
import AnimatedValueXY from "react-native/Libraries/Animated/src/nodes/AnimatedValueXY";

import {onlyUpdateForKeys} from "recompose";
import type {CompositeAnimation} from "react-native/Libraries/Animated/src/AnimatedImplementation";

import {consoleTime, consoleTimeEnd} from "../utils/debugUtils";
import {PanGestureHandler, State} from "react-native-gesture-handler";

class TouchableFalling extends React.Component {
	scaleAnimatedValue = new Animated.Value(1);
	spinAnimatedValue = new Animated.Value(0);
	fallingAnimation: ?CompositeAnimation;

	fallingDownValue: Animated.Value = new Animated.Value(0);

	lastOffset = {
		x: this.props.startPosition.top,
		y: this.props.startPosition.left
	};

	constructor(props) {
		super(props);

		this.spinAnimatedValue.addListener(({value}) => {
			this.spinValue = value;
		});

		this.lastOffset = {
			y: this.props.startPosition.top,
			x: this.props.startPosition.left
		};
	}

	componentDidMount() {
		this.startFallingAnimation();
	}

	onFall = lastFallingCoords => {
		if (!this.ended) {
			this.ended = true;
			this.props?.onFallDown(lastFallingCoords);
		}
	};

	startFallingAnimation = (delaySpin = 0) => {
		const currentY = Math.abs(
			this.fallingDownValue.__getValue() -
				this.lastOffset.y +
				this.props.startPosition.top
		);
		const maxY = Math.abs(this.props.fallToY + this.props.startPosition.top);

		const dif = 1 - currentY / maxY;
		const durration = dif * this.props.fallingDuration;

		const a = Animated.parallel([
			Animated.loop(
				Animated.timing(this.spinAnimatedValue, {
					delay: delaySpin,
					toValue: 1,
					duration: 5000,
					easing: t => t,
					useNativeDriver: true
				})
			),
			Animated.timing(this.fallingDownValue, {
				toValue: this.props.fallToY - this.lastOffset.y,
				duration: durration,
				easing: t => t / 2 + Math.pow(t, 1.5),
				useNativeDriver: true,
				onComplete: ({finished}) => finished && this.onFall(this.lastOffset)
			})
		]);

		this.fallingAnimation = a;
		a.start();
	};

	onHandlerStateChange = event => {
		if (event.nativeEvent.state === State.BEGAN) {
			this.props.onActionPerformed();
		}
	};

	render() {
		const {style, children, ...rest} = this.props;

		const spin = this.spinAnimatedValue.interpolate({
			inputRange: [0, 0.5, 1],
			outputRange: ["0deg", "360deg", "720deg"]
		});

		const panStyle = {
			top: this.props.startPosition.top,
			left: this.props.startPosition.left,
			transform: [
				{translateY: this.fallingDownValue},
				{scaleY: this.scaleAnimatedValue},
				{scaleX: this.scaleAnimatedValue},
				{rotate: spin}
			]
		};

		return (
			<PanGestureHandler onHandlerStateChange={this.onHandlerStateChange}>
				<Animated.View style={[style, panStyle]} {...rest}>
					{children}
				</Animated.View>
			</PanGestureHandler>
		);
	}

	componentWillUnmount() {
		this.fallingAnimation?.stop();
		this.scaleAnimatedValue.removeAllListeners();
		this.spinAnimatedValue.removeAllListeners();
		this.fallingDownValue.removeAllListeners();
	}
}

TouchableFalling.defauultProps = {
	startPosition: {
		top: 0,
		left: 0
	},
	fallToY: Dimensions.get("window").height
};

export default onlyUpdateForKeys([])(TouchableFalling);
