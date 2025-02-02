import React from 'react';

import { CloseOutlined } from '@ant-design/icons';

import { Row } from '../Row';

export const Popover = ({
  children,
  onClose,
  hiddenClose
}: {
  children: React.ReactNode;
  onClose: () => void;
  hiddenClose: boolean;
}) => {
  return (
    <div
      className="popover-container"
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)'
      }}>
      <div style={{ backgroundColor: '#1C1919', width: 340, padding: 20, borderRadius: 5 }}>
        {!hiddenClose && (
          <Row
            justifyEnd
            onClick={() => {
              onClose();
            }}>
            <CloseOutlined />
          </Row>
        )}

        {children}
      </div>
    </div>
  );
};
