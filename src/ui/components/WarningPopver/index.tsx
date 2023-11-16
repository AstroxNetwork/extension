import { Button } from '../Button';
import Checkbox from '../Checkbox';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';
import { useState } from 'react';

export const WarningPopver = ({
  text,
  onClose,
  onChecked,
  checkText
}: {
  text: string;
  onChecked?: (value) => void;
  checkText?: string;
  onClose: () => void;
}) => {
  const [checked, setChecked] = useState(false);
  return (
    <Popover onClose={() => {
      if(onChecked && !checked) return;
      onClose && onClose();
    }}>
      <Column justifyCenter itemsCenter>
        <Text text={'WARNING'} textCenter preset="title-bold" color="orange" />
        <Column mt="lg">
          <Text text={text} textCenter />
        </Column>
        {checkText && onChecked && (
          <Row mt="lg">
            <Checkbox
              checked={checked}
              onChange={() => {
                setChecked(!checked);
                onChecked && onChecked(!checked);
              }}
            />
            <Text text={checkText} color="textDim" />
          </Row>
        )}

        <Row full mt="lg">
          <Button
            text="OK"
            full
            disabled={onChecked && !checked}
            preset="primary"
            onClick={(e) => {
              if(onChecked && !checked) return;
              if (onClose) {
                onClose();
              }
            }}
          />
        </Row>
      </Column>
    </Popover>
  );
};
