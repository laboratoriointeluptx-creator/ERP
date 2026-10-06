/**
 * SYNTARA ERP Design System - Input Component
 */

import React, { forwardRef, ReactNode, useId, useImperativeHandle, useState } from 'react';
import { TextInput, Text, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../hooks';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'decimal' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local';

export interface InputProps { value?: string; defaultValue?: string; placeholder?: string; label?: string; helperText?: string; error?: string; disabled?: boolean; readOnly?: boolean; required?: boolean; size?: InputSize; type?: InputType; leftIcon?: ReactNode; rightIcon?: ReactNode; showCount?: boolean; maxLength?: number; onChangeText?: (text: string) => void; onBlur?: () => void; onFocus?: () => void; onSubmitEditing?: () => void; containerStyle?: StyleProp<ViewStyle>; inputStyle?: StyleProp<TextStyle>; labelStyle?: StyleProp<TextStyle>; helperStyle?: StyleProp<TextStyle>; testID?: string; id?: string; name?: string; autoComplete?: string; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; autoCorrect?: boolean; spellCheck?: boolean; inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'; pattern?: string; min?: number | string; max?: number | string; step?: number | string; ref?: React.RefObject<InputImperativeHandle>; accessibilityLabel?: string; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url' | 'default'; secureTextEntry?: boolean; }

export interface InputImperativeHandle { focus: () => void; blur: () => void; clear: () => void; setValue: (value: string) => void; }

const sizeStyles: Record<InputSize, { height: number; paddingHorizontal: number; paddingVertical: number; fontSize: number; labelFontSize: number; helperFontSize: number; iconSize: number; iconGap: number; borderRadius: number }> = { sm: { height: 36, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, labelFontSize: 11, helperFontSize: 10, iconSize: 16, iconGap: 8, borderRadius: 6 }, md: { height: 44, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, labelFontSize: 12, helperFontSize: 11, iconSize: 18, iconGap: 10, borderRadius: 8 }, lg: { height: 52, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, labelFontSize: 13, helperFontSize: 12, iconSize: 20, iconGap: 12, borderRadius: 10 } };

const Input = forwardRef<any, InputProps>(({ value, defaultValue = '', placeholder, label, helperText, error, disabled = false, readOnly = false, required = false, size = 'md', type = 'text', leftIcon, rightIcon, showCount = false, maxLength, onChangeText, onBlur, onFocus, onSubmitEditing, containerStyle, inputStyle, labelStyle, helperStyle, testID, id: providedId, name, autoComplete, autoCapitalize = 'none', autoCorrect = false, spellCheck = false, inputMode, pattern, min, max, step, accessibilityLabel, keyboardType, secureTextEntry }, ref) => {
  const { theme } = useTheme(); const colors = theme.colors; const generatedId = useId(); const id = providedId || generatedId;
  const labelId = `${id}-label`; const helperId = `${id}-helper`; const errorId = `${id}-error`;
  const [focused, setFocused] = useState(false); const [internalValue, setInternalValue] = useState(defaultValue);
  const [inputRef, setInputRef] = useState<any>(null);
  const controlled = value !== undefined; const currentValue = controlled ? value : internalValue;
  const currentLength = currentValue?.length || 0; const sStyles = sizeStyles[size];
  const handleChangeText = (text: string) => { if (!controlled) setInternalValue(text); onChangeText?.(text); };
  const handleFocus = () => { setFocused(true); onFocus?.(); };
  const handleBlur = () => { setFocused(false); onBlur?.(); };
  const handleSubmitEditing = () => { onSubmitEditing?.(); };
  useImperativeHandle(ref, () => ({ focus: () => inputRef?.focus(), blur: () => inputRef?.blur(), clear: () => { if (!controlled) setInternalValue(''); onChangeText?.(''); }, setValue: (v: string) => { if (!controlled) setInternalValue(v); onChangeText?.(v); } }), [controlled, onChangeText]);
  const hasError = !!error; const hasHelper = !!helperText && !hasError;
  const borderColor = hasError ? colors.border.error : focused ? colors.border.focus : colors.border.primary;
  const bgColor = disabled ? colors.surface.disabled : colors.surface.primary;
  const textColor = disabled ? colors.text.muted : colors.text.primary;
  const placeholderColor = colors.text.muted; const labelColor = hasError ? colors.border.error : colors.text.secondary; const helperColor = hasError ? colors.border.error : colors.text.muted;
  const containerStyleBase: ViewStyle = { flexDirection: 'column', gap: theme.spacing.semantic.labelGap };
  const inputWrapperStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor, borderWidth: focused || hasError ? 2 : 1, borderColor, borderRadius: sStyles.borderRadius, paddingHorizontal: sStyles.paddingHorizontal, paddingVertical: 0, height: sStyles.height };
  const inputStyleBase: TextStyle = { flex: 1, fontSize: sStyles.fontSize, fontFamily: theme.typography.fontFamily.primary, color: textColor, paddingVertical: 0, paddingHorizontal: 0, height: sStyles.height, backgroundColor: 'transparent' };
  const labelStyleBase: TextStyle = { fontSize: sStyles.labelFontSize, fontFamily: theme.typography.fontFamily.primary, fontWeight: theme.typography.fontWeight.bold, color: labelColor, letterSpacing: 0 };
  const helperStyleBase: TextStyle = { fontSize: sStyles.helperFontSize, fontFamily: theme.typography.fontFamily.primary, fontWeight: theme.typography.fontWeight.regular, color: helperColor };
  const iconStyle: ViewStyle = { width: sStyles.iconSize, height: sStyles.iconSize, alignItems: 'center', justifyContent: 'center' };
  const resolvedKeyboardType = keyboardType || (type === 'email' ? 'email-address' : type === 'number' || type === 'decimal' ? 'numeric' : type === 'tel' ? 'phone-pad' : type === 'url' ? 'url' : 'default');
  const resolvedSecureTextEntry = secureTextEntry !== undefined ? secureTextEntry : type === 'password';
  return <View style={[{ ...containerStyleBase, ...(containerStyle as ViewStyle) }]} testID={testID}>{label && <Text id={labelId} style={[{ fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', color: labelColor, letterSpacing: 0 }, labelStyle]}>{label}{required && <Text style={{ color: colors.semantic.error.main, marginLeft: 4 }}>*</Text>}</Text>}<View style={inputWrapperStyle}>{leftIcon && <View style={[{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 }]}>{React.isValidElement(leftIcon) ? React.cloneElement(leftIcon as any, { width: 18, height: 18, color: focused ? colors.border.focus : colors.text.muted }) : leftIcon}</View>}<TextInput ref={setInputRef} id={id} value={currentValue} onChangeText={handleChangeText} onFocus={handleFocus} onBlur={handleBlur} onSubmitEditing={handleSubmitEditing} placeholder={placeholder} placeholderTextColor={placeholderColor} style={[{ flex: 1, fontSize: 14, fontFamily: 'Inter', color: textColor, paddingVertical: 0, paddingHorizontal: 0, height: 44, backgroundColor: 'transparent' }, inputStyle]} editable={!readOnly} secureTextEntry={resolvedSecureTextEntry} keyboardType={resolvedKeyboardType} autoCapitalize={autoCapitalize} autoCorrect={autoCorrect} maxLength={maxLength} accessibilityLabel={accessibilityLabel || label} accessibilityHint={helperText} testID={testID ? `${testID}-input` : undefined} selectionColor={colors.brand.cyan} caretHidden={false} contextMenuHidden={false} dataDetectorTypes={[]} />{rightIcon && !hasError && !showCount && <View style={[{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }]}>{React.isValidElement(rightIcon) ? React.cloneElement(rightIcon as any, { width: 18, height: 18, color: colors.text.muted }) : rightIcon}</View>}{(hasError || showCount) && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 10 }}>{hasError && <Text style={{ fontSize: 11, color: colors.border.error, fontWeight: 'bold' }}>⚠</Text>}{showCount && <Text style={{ fontSize: 11, color: colors.text.muted, fontFamily: 'JetBrains Mono', fontVariant: ['tabular-nums'] }}>{currentLength}{maxLength ? ` / ${maxLength}` : ''}</Text>}</View>}</View>{(hasHelper || hasError) && <Text id={hasError ? errorId : helperId} style={[{ fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', color: helperColor }, helperStyle]} accessibilityLiveRegion="polite">{hasError ? error : helperText}</Text>}</View>;
});
Input.displayName = 'Input';
export default Input;