import { ATOM_NETWORK_TYPES } from '@/shared/constant';
import { AtomNetworkType } from '@/shared/types';
import { Content, Header, Layout, Icon, Column, Row, Card, Text, Input, Button } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import {
  useAtomNetworkType,
  useAtomicalCustomEndPoint,
  useChangeAtomCustomEndPointCallback,
  useChangeAtomNetworkTypeCallback,
  useNetworkType
} from '@/ui/state/settings/hooks';
import { useWallet } from '@/ui/utils';
import { useMemo, useState } from 'react';

export default function EndPointScreen() {
  const networkType = useAtomNetworkType();
  const network = useNetworkType();
  const wallet = useWallet();
  // const changeNetworkType = useChangeNetworkTypeCallback();
  const changeAtomNetworkType = useChangeAtomNetworkTypeCallback();
  const storeCustomEndPoint = useAtomicalCustomEndPoint();
  const changeAtomCustomEndPoint = useChangeAtomCustomEndPointCallback();
  const [customEndPoint, setCustomEndPoint] = useState(storeCustomEndPoint);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const selectCustom = useMemo(() => {
    return networkType === storeCustomEndPoint;
  }, [networkType, storeCustomEndPoint]);
  const [isEdit, setIsEdit] = useState(false);
  console.log('networkScreen', networkType, storeCustomEndPoint, selectCustom, isEdit);
  const tools = useTools();

  const checkEndPoint = async () => {
    if (!isEdit && selectCustom) {
      setCustomEndPoint('');
      return setIsEdit(true);
    }
    const isIndex = ATOM_NETWORK_TYPES.filter(o=> o.validNames.includes(network)).find((o) => o.value === customEndPoint);
    if (isIndex) {
      await changeAtomNetworkType(isIndex.value);
      tools.toastSuccess('Endpoint changed');
      return;
    }
    setLoading(true);
    const url = customEndPoint;
    fetch(url)
      .then((v) => v.json())
      .then(async (v) => {
        if (v && v.info && v.info.usageInfo) {
          await changeAtomCustomEndPoint(customEndPoint as AtomNetworkType);
          setIsEdit(false);
          tools.toastSuccess('Endpoint changed');
          return;
        }
        tools.toastError('Invalid endpoint');
      })
      .catch((e) => {
        console.log(e);
        tools.toastError('Invalid endpoint');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="Switch Endpoint"
      />
      <Content>
        <Column>
          {ATOM_NETWORK_TYPES.filter((o) => o.validNames.includes(network)).map((item, index) => {
            return (
              <Card
                key={index}
                onClick={async () => {
                  await changeAtomNetworkType(item.value);
                  tools.toastSuccess('Endpoint changed');
                }}>
                <Row full justifyBetween itemsCenter>
                  <Row itemsCenter>
                    <Text text={item.label} preset="regular-bold" />
                  </Row>
                  <Column>{item.value == networkType && <Icon icon="check" />}</Column>
                </Row>
              </Card>
            );
          })}
          <Column mt="lg">
            <Text text={'Custom:'} preset="regular-bold" />
            <Row full justifyBetween itemsCenter>
              <div style={{ flex: 1 }}>
                <Input
                  style={{
                    width: '100%'
                  }}
                  value={customEndPoint}
                  placeholder="https://"
                  disabled={selectCustom && isEdit == false}
                  onChange={(e) => {
                    setCustomEndPoint(e.target.value.trim());
                  }}
                />
              </div>
              <div>
                <Button
                  disabled={loading || !customEndPoint || !/https?:\/\/[a-zA-Z-./]+/.test(customEndPoint)}
                  preset="primary"
                  onClick={checkEndPoint}
                  text={loading ? 'Checking' : selectCustom && !isEdit ? 'Custom' : 'Check & Setup'}
                />
              </div>
            </Row>
            {/*
            <Button
              preset="primary"
              onClick={async() => {
                await wallet.setAtomicalCustomEndPoint(network, '')
              }}
              text={loading ? 'Checking': selectCustom && !isEdit ? 'Custom' : 'Check & Setup'}
            /> */}
            {error && <Text text={error} color="red" />}
          </Column>
        </Column>
      </Content>
    </Layout>
  );
}
