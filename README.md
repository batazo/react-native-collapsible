# Fork from

[jkrmarmol - react-native-collapsible](https://github.com/jkrmarmol/react-native-collapsible)

# 📦 React Native Collapsible Component

A simple and customizable React Native component for collapsible content, supporting smooth expand/collapse animations and accordion behavior.

Perfect for creating accordion UIs, toggle sections, or dynamically hiding/showing content with smooth animations.

## ✨ Features

- 🧩 Simple API
- ⚙️ Custom animation duration and easing
- 📐 Supports alignments (`top`, `center`, `bottom`)
- 📱 Built using React Native's `Animated`
- ⚡ High performance, uses `useNativeDriver` option where applicable

## 📦 Installation

```bash
npm install @batazo/react-native-collapsible
# or
yarn add @batazo/react-native-collapsible
```

## 🚀 Usage

```js
import React, { useState } from 'react';
import { Text, Button, View } from 'react-native';
import { Collapsible } from '@batazo/react-native-collapsible';

const MyComponent = () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View>
      <Button title="Toggle" onPress={() => setCollapsed(!collapsed)} />
      <Collapsible collapsed={collapsed}>
        <Text>This content can be collapsed and expanded.</Text>
      </Collapsible>
    </View>
  );
};
```

| Prop                      | Type                                | Default          | Description                                                                                               |
| ------------------------- | ----------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `align`                   | `'top'` \| `'center'` \| `'bottom'` | `'top'`          | Alignment of the content when expanding.                                                                  |
| `collapsed`               | `boolean`                           | `true`           | If true, the component is collapsed.                                                                      |
| `collapsedHeight`         | `number`                            | `0`              | The height of the view when collapsed.                                                                    |
| `duration`                | `number`                            | `300`            | Duration of the expand/collapse animation in ms.                                                          |
| `easing`                  | `string`                            | `'easeOutCubic'` | Easing function used in animation. Accepts built-in `Easing` keys or custom string like `easeInOutCubic`. |
| `onAnimationEnd`          | `() => void`                        | `() => null`     | Callback called after the animation completes.                                                            |
| `renderChildrenCollapsed` | `boolean`                           | `true`           | Whether to render children while collapsed. Useful for keeping state/mounting.                            |
| `style`                   | `StyleProp<ViewStyle>`              | `undefined`      | Optional styling for the animated content container.                                                      |
| `enablePointerEvents`     | `boolean`                           | `false`          | If false, disables pointer events when collapsed.                                                         |
| `children`                | `ReactNode`                         | -                | The content to show/hide.                                                                                 |
| `name`                    | `string`                            | `'N/A'`          | Name of Collapsible component                                                                             |
| `logging`                 | `boolean`                           | `false`          | State logging with name                                                                                   |

## 🧪 Examples

### Basic Collapsible

```js
<Collapsible collapsed={true}>
  <Text>Hidden content</Text>
</Collapsible>
```

### Collapsible with Alignment

```js
<Collapsible collapsed={false} align="bottom">
  <Text>This will slide in from the bottom.</Text>
</Collapsible>
```

### Custom Animation

```js
<Collapsible collapsed={false} duration={500} easing="easeInOutQuart">
  <Text>Custom easing and duration</Text>
</Collapsible>
```

## 📌 Notes

- This component uses React Native’s layout measurement for animation, so make sure content is rendered properly.

- To ensure performance, do not use complex nested views inside the collapsible unless necessary.

## 👨‍💻 Contributing

PRs, issues, and feature requests are welcome! If you like this library, consider giving it a ⭐️.

## 📝 License

MIT License © 2026 [Z Bata](https://github.com/batazo)
