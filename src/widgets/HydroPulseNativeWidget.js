import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function HydroPulseNativeWidget({
  percentage = 50,
  remainingLiters = 500,
  depthMeters = '1.00',
  motorState = false,
  flowStatus = 'stable',
  updatedDisplay = 'Just now',
}) {
  const isHigh = percentage >= 85;
  const isLow = percentage <= 20;
  const statusColor = isLow ? '#EF4444' : isHigh ? '#10B981' : '#0284C7';
  const pumpColor = motorState ? '#10B981' : '#64748B';
  const pumpText = motorState ? 'PUMP ON' : 'OFF';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header: Brand and Pump Badge */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="● Hydro Pulse"
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#0284C7',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: motorState ? '#DCFCE7' : '#F1F5F9',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <TextWidget
            text={pumpText}
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: pumpColor,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Main Metric: Large Level Percentage */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginVertical: 4,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <TextWidget
            text={`${percentage}`}
            style={{
              fontSize: 34,
              fontWeight: 'bold',
              color: statusColor,
            }}
          />
          <TextWidget
            text="%"
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: statusColor,
            }}
          />
        </FlexWidget>

        <TextWidget
          text={`${remainingLiters} L  •  ${depthMeters} m`}
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: '#64748B',
          }}
        />
      </FlexWidget>

      {/* Footer: Flow Status & Timestamp */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={flowStatus === 'filling' ? 'Filling...' : flowStatus === 'dropping' ? 'Water Dropping' : 'Stable Level'}
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: '#334155',
          }}
        />
        <TextWidget
          text={updatedDisplay}
          style={{
            fontSize: 10,
            color: '#94A3B8',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
