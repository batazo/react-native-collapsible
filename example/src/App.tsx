import { Text, SafeAreaView, Button, StyleSheet } from 'react-native';
import { Collapsible } from '@jkrmarmol/react-native-collapsible';
import { useState } from 'react';

export default function App(this: any) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Toggle" onPress={() => setCollapsed(!collapsed)} />
      <Collapsible collapsed={collapsed} duration={300}>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla at mi
          nibh. Aenean id suscipit urna.
        </Text>
      </Collapsible>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
});
