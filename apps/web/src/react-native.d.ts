declare module 'react-native' {
  import type { ComponentType, CSSProperties, ReactNode } from 'react';

  interface CommonProps {
    children?: ReactNode;
    style?: CSSProperties | (CSSProperties | false | null | undefined)[];
  }

  export const View: ComponentType<CommonProps>;
  export const SafeAreaView: ComponentType<CommonProps>;
  export const ScrollView: ComponentType<CommonProps & { contentContainerStyle?: CSSProperties }>;
  export const Text: ComponentType<CommonProps & { onPress?: () => void }>;
  export const Pressable: ComponentType<CommonProps & { onPress?: () => void }>;
  export const StyleSheet: { create<T extends Record<string, CSSProperties>>(styles: T): T };
}
