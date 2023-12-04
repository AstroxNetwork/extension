import { Content, Header, Layout, Column, Row, Text } from '@/ui/components';
import {
  useAdvanced,
  useAdvancedCallback
} from '@/ui/state/settings/hooks';
import Switch from '@/ui/components/Switch';
import { useState } from 'react';

export default function AdvancedScreen() {
  const advanced = useAdvanced();
  const switchAdvanced = useAdvancedCallback();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('advancedScreen', advanced)
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="Advanced"
      />
      <Content>
        <Column>
          <Row full justifyBetween itemsCenter mt='lg'>
            <Column>
              <Text text={'Security Check'} size="lg" preset="regular-bold" />
              <Text
                text={
                  'Turn this on to verify transactions on confirmation screens. We recommend most users enable it. If turned off, send transactions at your own risk.'
                }
                color="textDim"
                preset="regular"
              />
            </Column>
            <Switch checked={advanced.securityCheck} onChange={async (checked) => {
              await switchAdvanced({
                ...advanced,
                securityCheck: checked
              });
            }} />
          </Row>
          <Row full justifyBetween itemsCenter mt='lg'>
            <Column>
              <Text text={'RBF'} size="lg" preset="regular-bold" />
              <Text
                text={
                  'Turn this on for RBF-enabled transactions that need acceleration. This is an advanced feature, use cautiously.'
                }
                color="textDim"
                preset="regular"
              />
            </Column>
            <Switch checked={advanced.rbf} onChange={async (checked) => {
              await switchAdvanced({
                ...advanced,
                rbf: checked
              });
            }} />
          </Row>
        </Column>
      </Content>
    </Layout>
  );
}
