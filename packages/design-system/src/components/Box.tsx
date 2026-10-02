/**
 * SYNTARA ERP Design System - Box Component
 */

import React, { forwardRef, ReactNode } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../hooks';

export interface BoxProps {
  children?: ReactNode; p?: number; px?: number; py?: number; pt?: number; pb?: number; pl?: number; pr?: number;
  m?: number; mx?: number; my?: number; mt?: number; mb?: number; ml?: number; mr?: number;
  flex?: number; direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: number; rowGap?: number; columnGap?: number; wrap?: boolean;
  width?: number; height?: number; minWidth?: number; minHeight?: number; maxWidth?: number; maxHeight?: number;
  bg?: string; radius?: number; shadow?: string;
  borderWidth?: number; borderColor?: string; position?: 'absolute' | 'relative';
  top?: number; right?: number; bottom?: number; left?: number;
  zIndex?: number; overflow?: 'visible' | 'hidden' | 'scroll'; opacity?: number; visible?: boolean;
  testID?: string; style?: StyleProp<ViewStyle>; ref?: React.RefObject<View>; as?: React.ElementType;
}

const Box = forwardRef<View, BoxProps>(
  ({ children, p, px, py, pt, pb, pl, pr, m, mx, my, mt, mb, ml, mr, flex, direction = 'column', align, justify, gap, rowGap, columnGap, wrap, width, height, minWidth, minHeight, maxWidth, maxHeight, bg, radius, shadow, borderWidth, borderColor, position, top, right, bottom, left, zIndex, overflow, opacity, visible = true, testID, style, as: AsComponent = View, ...rest }, ref) => {
    const { getShadow } = useTheme();
    if (!visible) return null;
    const boxStyle: ViewStyle = { flex, flexDirection: direction, alignItems: align, justifyContent: justify, flexWrap: wrap ? 'wrap' : 'nowrap', width, height, minWidth, minHeight, maxWidth, maxHeight, backgroundColor: bg, borderRadius: radius, borderWidth, borderColor, position, top, right, bottom, left, zIndex, overflow, opacity, padding: p, paddingHorizontal: px, paddingVertical: py, paddingTop: pt, paddingBottom: pb, paddingLeft: pl, paddingRight: pr, margin: m, marginHorizontal: mx, marginVertical: my, marginTop: mt, marginBottom: mb, marginLeft: ml, marginRight: mr, gap, rowGap, columnGap };
    if (shadow) Object.assign(boxStyle, getShadow(shadow));
    return <AsComponent ref={ref} style={[boxStyle, style]} testID={testID} {...rest}>{children}</AsComponent>;
  }
);
Box.displayName = 'Box';
export default Box;