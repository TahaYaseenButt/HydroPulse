import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HydroPulseNativeWidget } from './HydroPulseNativeWidget';

const WIDGET_DATA_KEY = '@hydropulse_widget_data_v1';

export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      let data = {
        percentage: 50,
        remainingLiters: 500,
        depthMeters: '1.00',
        motorState: false,
        flowStatus: 'stable',
        updatedDisplay: 'Just now',
      };

      try {
        const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          data = { ...data, ...parsed };
        }
      } catch (e) {
        console.warn('[WidgetTaskHandler] Error reading storage:', e);
      }

      props.renderWidget(
        <HydroPulseNativeWidget
          percentage={data.percentage}
          remainingLiters={data.remainingLiters}
          depthMeters={data.depthMeters}
          motorState={data.motorState}
          flowStatus={data.flowStatus}
          updatedDisplay={data.updatedDisplay || 'Just now'}
        />
      );
      break;
    }

    case 'WIDGET_CLICK':
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
