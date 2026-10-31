import { useEffect, useRef } from 'react';
import { Keyboard, type ScrollViewInstance, TextInput } from 'react-native';

// Room left above the field, so its label stays readable.
const GAP = 48;

/**
 * Scrolls the returned ScrollView so the focused text field sits near the top once the keyboard
 * opens. A KeyboardAvoidingView only shrinks the page; it doesn't scroll to the field, so one low on
 * the page stays under the keyboard. keyboardDidShow, because keyboardWillShow never fires on Android.
 */
export function useKeepFocusedInputVisible() {
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      const input = TextInput.State.currentlyFocusedInput();
      const content = scrollRef.current?.getInnerViewRef();
      if (!input || !content) return;
      // y is the field's offset inside the scrolled content; scrollTo clamps past the end itself.
      // A field outside it (in a dialog's Modal) can't be measured against it, so it's left alone.
      input.measureLayout(
        content,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - GAP) }),
        () => {},
      );
    });
    return () => sub.remove();
  }, []);

  return scrollRef;
}
