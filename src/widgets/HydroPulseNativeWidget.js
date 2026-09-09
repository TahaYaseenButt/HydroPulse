import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function HydroPulseNativeWidget({
  widgetInfo,
  percentage = 50,
  remainingLiters = 500,
  depthMeters = '1.00',
  motorState = false,
  flowStatus = 'stable',
  updatedDisplay = 'Just now',
}) {
  const width = widgetInfo?.width || 320;
  const height = widgetInfo?.height || 140;

  const isWide = width >= 240;
  const isTall = height >= 180;

  const clampedPercent = Math.min(100, Math.max(0, Math.round(percentage)));
  const isHigh = clampedPercent >= 85;
  const isLow = clampedPercent <= 20;
  const statusColor = isLow ? '#EF4444' : isHigh ? '#10B981' : '#0284C7';
  const pumpColor = motorState ? '#10B981' : '#64748B';
  const pumpText = motorState ? 'PUMP ON' : 'STANDBY';

  // Flow status label
  const isOffline = flowStatus === 'offline';
  const flowLabel =
    isOffline
      ? '● ESP32 Offline'
      : flowStatus === 'filling'
      ? '↑ Filling'
      : flowStatus === 'dropping'
      ? '↓ Using Water'
      : '● Stable Level';
  const flowColor =
    isOffline
      ? '#EF4444'
      : flowStatus === 'filling'
      ? '#10B981'
      : flowStatus === 'dropping'
      ? '#EF4444'
      : '#64748B';

  return (
    <FlexWidget
      style={{
        width: width,
        height: height,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: isWide ? 16 : 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* ── TOP ROW: Brand and Pump Badge ── */}
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
              fontSize: isWide ? 14 : 12,
              fontWeight: '700',
              color: '#0284C7',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: motorState ? '#DCFCE7' : '#F1F5F9',
            borderRadius: 14,
            paddingHorizontal: isWide ? 10 : 7,
            paddingVertical: 4,
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

      {/* ── CENTER AREA: Responsive based on Wide vs Tall vs Compact ── */}
      {isWide && !isTall ? (
        /* Wide Horizontal Layout (4x2, 3x2) */
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: 'match_parent',
            marginVertical: 4,
          }}
        >
          {/* Left: Large Percentage */}
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <TextWidget
              text={`${clampedPercent}`}
              style={{
                fontSize: 42,
                fontWeight: 'bold',
                color: statusColor,
              }}
            />
            <TextWidget
              text="%"
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: statusColor,
              }}
            />
          </FlexWidget>

          {/* Right: Key Tank Metrics */}
          <FlexWidget
            style={{
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text={`${remainingLiters} L remaining`}
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 2,
              }}
            />
            <TextWidget
              text={`Depth: ${depthMeters} m`}
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: '#64748B',
              }}
            />
          </FlexWidget>
        </FlexWidget>
      ) : isTall ? (
        /* Tall Vertical Layout (2x4, 3x4, 4x4) */
        <FlexWidget
          style={{
            flexDirection: 'column',
            justifyContent: 'space-around',
            alignItems: 'center',
            width: 'match_parent',
            flex: 1,
            marginVertical: 8,
          }}
        >
          {/* Main Percentage */}
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <TextWidget
              text={`${clampedPercent}`}
              style={{
                fontSize: 52,
                fontWeight: 'bold',
                color: statusColor,
              }}
            />
            <TextWidget
              text="%"
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: statusColor,
              }}
            />
          </FlexWidget>

          {/* Metrics Pill Grid */}
          <FlexWidget
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              paddingVertical: 10,
              paddingHorizontal: 16,
              width: 'match_parent',
            }}
          >
            <TextWidget
              text={`${remainingLiters} Liters`}
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 4,
              }}
            />
            <TextWidget
              text={`Water Depth: ${depthMeters} m`}
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: '#64748B',
              }}
            />
          </FlexWidget>
        </FlexWidget>
      ) : (
        /* Compact Square Layout (2x2) */
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginVertical: 4,
          }}
        >
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <TextWidget
              text={`${clampedPercent}`}
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
            text={`${remainingLiters} L • ${depthMeters} m`}
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: '#64748B',
              marginTop: 2,
            }}
          />
        </FlexWidget>
      )}

      {/* ── FOOTER: Flow Status & Timestamp ── */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          paddingTop: 4,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        }}
      >
        <TextWidget
          text={flowLabel}
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: flowColor,
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
