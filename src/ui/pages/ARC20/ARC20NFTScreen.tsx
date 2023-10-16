import { useEffect, useMemo, useState } from 'react';

import { AddressTokenSummary } from '@/shared/types';
import { Button, Column, Content, Grid, Header, Image, Input, Layout, Row, Text } from '@/ui/components';
import { useAccountBalance, useAtomicals, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { isValidAddress, returnImageType, useLocationState, useWallet } from '@/ui/utils';

import { useNavigate } from '../MainRoute';
import ARC20NFTCard from '@/ui/components/ARC20NFTCard';
import { LoadingOutlined } from '@ant-design/icons';
import Checkbox from '@/ui/components/Checkbox';
import { useBitcoinTx, useCreateARCNFTTxCallback } from '@/ui/state/transactions/hooks';
import { FeeRateBar } from '@/ui/components/FeeRateBar';

interface LocationState {
  ticker: string;
}

enum Step {
  SelectNFTs,
  Preview,
  Confirm
}

function Preview(props: { selectValues: string[]; updateStep: (step: Step) => void }) {
  const { selectValues, updateStep } = props;
  const bitcoinTx = useBitcoinTx();
  const atomicals = useAtomicals();
  const accountBalance = useAccountBalance();
  const [feeRate, setFeeRate] = useState(5);
  const [toInfo, setToInfo] = useState<{
    address: string;
    domain: string;
  }>({
    address: bitcoinTx.toAddress,
    domain: bitcoinTx.toDomain
  });
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(true);
  const createARC20NFTTx = useCreateARCNFTTxCallback();

  useEffect(() => {
    setError('');
    setDisabled(true);

    if (!isValidAddress(toInfo.address)) {
      return;
    }

    setDisabled(false);
  }, [toInfo, feeRate]);

  const selectAtomcals = useMemo(() => {
    if (!atomicals.atomicalNFTs) return [];
    return atomicals.atomicalNFTs
      .filter((o) => selectValues.includes(o.atomical_id));
  }, [atomicals]);

  const utxos = atomicals.atomicalsUTXOs.filter((o) => selectValues.includes(`${o.atomicals?.[0]}`));

  const outputs = useMemo(() => {
    const outputs = utxos.map((utxo) => ({
      value: utxo.value,
      address: toInfo.address
    }));
    return outputs;
  }, [toInfo]);
  const onClickNext = async () => {
    const obj = {
      selectedUtxos: utxos ?? [],
      outputs: outputs ?? []
    };
    const rawTxInfo = await createARC20NFTTx(obj, toInfo, atomicals.regularsUTXOs, feeRate, false);
    if(rawTxInfo && rawTxInfo.err) {
      return setError(rawTxInfo.err);
    }
    if (rawTxInfo && rawTxInfo.fee) {
      if (rawTxInfo.fee > atomicals.regularsValue) {
        setError(`Fee ${rawTxInfo.fee} sats Insufficient BTC balance`);
        return;
      }
      navigate('ARC20ConfirmScreen', { rawTxInfo });
    }
  };

  return (
    <Layout>
      <Header
        title="Send NFTs"
        onBack={() => {
          updateStep(Step.SelectNFTs);
        }}
      />
      <Content>
        <Column full justifyBetween>
          <Column>
            <Column mt="lg">
              <Text text="Recipient" preset="regular" color="textDim" />
              <Input
                preset="address"
                addressInputData={toInfo}
                onAddressInputChange={(val) => {
                  setToInfo(val);
                }}
                autoFocus={true}
              />
            </Column>
            <Column mt="lg">
              <Text text="NFTs" preset="regular" color="textDim" />
              <Text
                text={`All Include: ${selectAtomcals.map((o) => o.value).reduce((pre, cur) => pre + cur, 0)} sats`}
                color="textDim"
                size="xs"
              />
              <Grid columns={3}>
                <Text text={'Preview'} textCenter color="text" size="sm" />
                <Text text={'AtomicalNumber'} textCenter size="sm" />
                <Text text={'value'} textCenter size="sm" />
              </Grid>
              {selectAtomcals.map((data, index) => {
                const { type, content } = returnImageType(data);
                return (
                  <Grid columns={3} key={index} style={{ alignItems: 'center' }}>
                    <Column itemsCenter>
                      {type === 'realm' ? <Text text={content} /> : <Image src={content} size={24} />}
                    </Column>
                    <Text text={`# ${data.atomical_number}`} textCenter color="textDim" size="xs" />
                    <Text text={data.value} textCenter color="textDim" size="xs" />
                  </Grid>
                );
              })}
            </Column>
            <Column mt="lg">
              <Row justifyBetween>
              <Text text={'Available (safe for fee)'} color="textDim" />
              <Text
                text={ `${accountBalance.btc_amount} BTC`}
                preset="bold"
                size="sm"
              />
            </Row>
            </Column>
            <Column mt="lg">
              <Text text={'Real-time Fee Rate'} preset="regular" color="textDim" />
              <FeeRateBar
                onChange={(val) => {
                  setFeeRate(val);
                }}
              />
            </Column>
          </Column>

          <Column>
            {error && <Text text={error} color="error" />}
            <Button text="Next" preset="primary" onClick={onClickNext} disabled={disabled} />
          </Column>
        </Column>
      </Content>
    </Layout>
  );
}

const ARC20NFTScreen = () => {
  const { ticker } = useLocationState<LocationState>();

  const [tokenSummary, setTokenSummary] = useState<AddressTokenSummary>({
    tokenBalance: {
      ticker,
      overallBalance: '',
      availableBalance: '',
      transferableBalance: '',
      availableBalanceSafe: '',
      availableBalanceUnSafe: ''
    },
    tokenInfo: {
      totalSupply: '',
      totalMinted: ''
    },
    historyList: [],
    transferableList: []
  });

  const wallet = useWallet();

  const account = useCurrentAccount();

  const atomicals = useAtomicals();
  useEffect(() => {
    wallet.getBRC20Summary(account.address, ticker).then((tokenSummary) => {
      setTokenSummary(tokenSummary);
    });
  }, []);

  const navigate = useNavigate();
  const [step, setStep] = useState(Step.SelectNFTs);

  const [checkedList, setCheckedList] = useState<string[]>([]);

  const onChange = (checkedValues: any) => {
    setCheckedList(checkedValues);
  };

  if (step === Step.Preview) {
    return <Preview selectValues={checkedList} updateStep={setStep} />;
  }

  return (
    <Layout>
      <Header
        title="Send NFTs"
        onBack={() => {
          navigate('MainScreen');
        }}
      />
      <Content>
        {atomicals.atomicalsValue ? (
          <Column full justifyBetween>
            <Column>
              <Text text="Select NFT to send" preset="regular" color="textDim" />
              <Row style={{ flexWrap: 'wrap', maxHeight: 'calc(100vh - 170px)', overflow: 'auto' }} gap="sm" full>
                <Checkbox.Group onChange={onChange} value={checkedList}>
                  {atomicals.atomicalNFTs
                    .map((data, index) => {
                      return <ARC20NFTCard key={index} checkbox selectvalues={checkedList} tokenBalance={data} />;
                    })}
                </Checkbox.Group>
              </Row>
            </Column>
            <Column>
              <Button
                text="Send"
                preset="default"
                icon="send"
                disabled={checkedList.length === 0}
                style={{ height: 30 }}
                onClick={(e) => {
                  setStep(Step.Preview);
                }}
                full
              />
            </Column>
          </Column>
        ) : (
          <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
            <LoadingOutlined />
          </Column>
        )}
      </Content>
    </Layout>
  );
};

export default ARC20NFTScreen;
