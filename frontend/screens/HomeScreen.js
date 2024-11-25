import React from 'react';
import { View, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <View>
            <Button title="Generate Lyrics" onPress={() => navigation.navigate("Generate")} />
            <Button title="Library" onPress={() => navigation.navigate("Library")} />
        </View>
    );
}
