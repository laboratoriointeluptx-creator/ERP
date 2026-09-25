declare module 'react-native' {
  import type { ComponentType, CSSProperties, ReactNode } from 'react';

  interface CommonProps {
    children?: ReactNode;
    style?: CSSProperties | (CSSProperties | false | null | undefined)[];
    accessibilityRole?: string;
    accessibilityLabel?: string;
    disabled?: boolean;
  }

  export const View: ComponentType<CommonProps>;
  export const SafeAreaView: ComponentType<CommonProps>;
  export const ScrollView: ComponentType<CommonProps & { contentContainerStyle?: CSSProperties }>;
  export const Text: ComponentType<CommonProps & { onPress?: () => void }>;
  export const Pressable: ComponentType<CommonProps & { onPress?: () => void }>;
  export const TextInput: ComponentType<CommonProps & {
    value?: string;
    placeholder?: string;
    autoCapitalize?: string;
    keyboardType?: string;
    secureTextEntry?: boolean;
    onChangeText?: (value: string) => void;
    onSubmitEditing?: () => void;
  }>;
  export const StyleSheet: { create<T extends Record<string, CSSProperties>>(styles: T): T };
}
