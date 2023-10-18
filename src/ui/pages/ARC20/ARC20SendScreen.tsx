import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { RawTxInfo, TokenTransfer, TransferFtConfigInterface } from '@/shared/types';
import { Button, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { useAccountAddress, useAccountBalance, useAtomicals } from '@/ui/state/accounts/hooks';
import {
  useBitcoinTx,
  useCreateARC20TxCallback
} from '@/ui/state/transactions/hooks';
import { isValidAddress, satoshisToAmount } from '@/ui/utils';

import { useNavigate } from '../MainRoute';
import { IAtomicalItem, UTXO } from '@/background/service/interfaces/api';
import { DUST_AMOUNT } from '@/shared/constant';

enum TabKey {
  STEP1,
  STEP2,
  STEP3
}

interface ContextData {
  tabKey: TabKey;
  tokenBalance: IAtomicalItem;
  transferAmount: number;
  transferableList: TokenTransfer[];
  inscriptionIdSet: Set<string>;
  feeRate: number;
  receiver: string;
  rawTxInfo: RawTxInfo;
}

interface UpdateContextDataParams {
  tabKey?: TabKey;
  transferAmount?: number;
  transferableList?: TokenTransfer[];
  inscriptionIdSet?: Set<string>;
  feeRate?: number;
  receiver?: string;
  rawTxInfo?: RawTxInfo;
}

function Step1({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const accountBalance = useAccountBalance();
  const fromAddress = useAccountAddress();
  const navigate = useNavigate();
  const bitcoinTx = useBitcoinTx();
  const [disabled, setDisabled] = useState(true);
  const [inputAmount, setInputAmount] = useState(
    bitcoinTx.toSatoshis > 0 ? satoshisToAmount(bitcoinTx.toSatoshis) : ''
  );
  const [feeRate, setFeeRate] = useState(5);
  const [error, setError] = useState('');
  const [toInfo, setToInfo] = useState<{
    address: string;
    domain: string;
  }>({
    address: bitcoinTx.toAddress,
    domain: bitcoinTx.toDomain
  });
  // const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const createARC20Tx = useCreateARC20TxCallback();
  const atomicals = useAtomicals();
  const relatedAtomUtxos = atomicals.atomicalsUTXOs
    ? atomicals.atomicalsUTXOs.filter((o) => o.atomicals?.includes(contextData.tokenBalance.atomical_id) )
    : [];

  useEffect(() => {
    setError('');
    setDisabled(true);

    if (inputAmount && Number(inputAmount) < DUST_AMOUNT) {
      return setError(`Amount must be at least ${DUST_AMOUNT} sats`);
    }

    if (!isValidAddress(toInfo.address)) {
      return;
    }

    if (!inputAmount) {
      return;
    }
    setDisabled(false);
  }, [toInfo, inputAmount, feeRate]);

  const {
    utxos,
    outputs,
    remaining_utxos,
    remaining,
    remaining_min,
    totalAmount
  } = useMemo(() => {
    const currentOutputValue = Number(inputAmount);
    if (currentOutputValue < DUST_AMOUNT) {

      return {
        utxos: [],
        outputs: [],
        remaining_utxos: [],
        remaining: 0,
        remaining_min: 0,
        totalAmount: 0
      };
    }
    const sorted = Array.from(relatedAtomUtxos).sort((a, b) => b.value - a.value);
    const outputs = [
      {
        value: currentOutputValue as number,
        address: toInfo.address
      }
    ];
    let _selectedValue = 0;
    const _selectedUtxos: UTXO[] = [];
    let _break_i: number | undefined = undefined;
    for (let i = 0; i < sorted.length; i++) {
      _selectedValue += sorted[i].value;
      _selectedUtxos.push(sorted[i]);
      if (_selectedValue === currentOutputValue || _selectedValue >= currentOutputValue + DUST_AMOUNT) {
        _break_i = i;
        break;
      }
    }

    const _remaining_utxos: UTXO[] = [];
    let _remaining_balances = 0;
    if (_break_i !== undefined) {
      for (let i = _break_i + 1; i < sorted.length; i += 1) {
        _remaining_utxos.push(sorted[i]);
        _remaining_balances += sorted[i].value;
      }
    }

    let remaining_min: number | undefined;
    const diff = _selectedValue - currentOutputValue;
    if (diff === 0) {
      remaining_min = 0;
    } else if (diff >= 2 * DUST_AMOUNT) {
      remaining_min = diff - DUST_AMOUNT;
    } else if (diff >= DUST_AMOUNT && diff < 2 * DUST_AMOUNT) {
      remaining_min = diff;
    } else {
      remaining_min = undefined;
    }
    let finalTokenOutputs: { value: number; address: string; ticker: string; change: boolean }[] = [];
    const changeAmount = _selectedValue - (currentOutputValue ?? 0);

    finalTokenOutputs = outputs.map((f) => {
      return { value: f.value, address: toInfo.address, ticker: contextData.tokenBalance.$ticker as string, change: false };
    });
    if (changeAmount > 0) {
      finalTokenOutputs.push({
        value: changeAmount,
        address: fromAddress,
        ticker: contextData.tokenBalance.$ticker!,
        change: true
      });
    }
    finalTokenOutputs = [...finalTokenOutputs];

    return {
      outputs: finalTokenOutputs,
      atomicalsId: contextData.tokenBalance.atomical_id,
      confirmed: contextData.tokenBalance.confirmed,
      totalAmount: currentOutputValue || 0,
      utxos: _selectedUtxos.length > 0 ? _selectedUtxos : [],
      remaining: _remaining_balances,
      remaining_min,
      remaining_utxos: _remaining_utxos
    };
  }, [contextData.tokenBalance, inputAmount, toInfo, feeRate]);

  const onClickNext = async () => {
    const obj: TransferFtConfigInterface = {
      selectedUtxos: utxos ?? [],
      type: contextData?.tokenBalance?.type,
      outputs: outputs ?? [],
    };
    const rawTxInfo = await createARC20Tx(obj, toInfo, atomicals.regularsUTXOs, feeRate, false);
    if(rawTxInfo && rawTxInfo.err) {
      return setError(rawTxInfo.err);
    }
    if(rawTxInfo && rawTxInfo.fee) {
      if(rawTxInfo.fee > atomicals.regularsValue ) {
        setError(`Fee ${rawTxInfo.fee} sats Insufficient BTC balance`);
        return;
      }
      navigate('ARC20ConfirmScreen', { rawTxInfo });
    }
  };

  return (
    <Content mt="lg">
      <Column full>
        <Column gap="lg" full>
          <Column>
            <Text text={`${contextData.tokenBalance.$ticker} Balance`} color="textDim" />
            <Text text={`${contextData.tokenBalance.value.toLocaleString()} ${contextData.tokenBalance.$ticker}`} size="xxl" textCenter my="lg" />
          </Column>

          {/* <Column>
            <TransferableList contextData={contextData} updateContextData={updateContextData} />
          </Column> */}

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
            <Input
              preset="amount"
              disableDecimal
              placeholder={'Amount'}
              defaultValue={inputAmount}
              value={inputAmount}
              onAmountInputChange={async (value) => {
                // if (autoAdjust == true) {
                //   setAutoAdjust(false);
                // }
                setInputAmount(value);
              }}
            />
          </Column>
          <Row justifyBetween>
            <Text text={'Available (safe for fee)'} color="textDim" />
            <Text
              text={ `${accountBalance.btc_amount} BTC`}
              preset="bold"
              size="sm"
            />
          </Row>
          <Column>
            <Text text="Real-time Fee Rate" color="textDim" />
            <FeeRateBar
              onChange={(val) => {
                setFeeRate(val);
              }}
            />
          </Column>
        </Column>
        {error && <Text text={error} color="error" />}
        <Button text="Next" preset="primary" onClick={onClickNext} disabled={disabled} />
      </Column>
    </Content>
  );
}


const ARC20SendScreen = () => {
  const { state } = useLocation();
  const props = state as {
    tokenBalance: IAtomicalItem;
    selectedInscriptionIds: string[];
    selectedAmount: number;
  };

  const tokenBalance = props.tokenBalance;
  const selectedInscriptionIds = props.selectedInscriptionIds || [];
  const selectedAmount = props.selectedAmount || 0;

  const [contextData, setContextData] = useState<ContextData>({
    tabKey: TabKey.STEP1,
    tokenBalance,
    transferAmount: selectedAmount,
    transferableList: [],
    inscriptionIdSet: new Set(selectedInscriptionIds),
    feeRate: 5,
    receiver: '',
    rawTxInfo: {
      psbtHex: '',
      rawtx: '',
      fee: 0,
    }
  });

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData]
  );

  const component = useMemo(() => {
    if (contextData.tabKey === TabKey.STEP1) {
      return <Step1 contextData={contextData} updateContextData={updateContextData} />;
    }
    // else if (contextData.tabKey === TabKey.STEP2) {
    //   return <Step2 contextData={contextData} updateContextData={updateContextData} />;
    // }
    // else {
    //   return <Step3 contextData={contextData} updateContextData={updateContextData} />;
    // }
  }, [contextData]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="Send ARC20"
      />
      <Row mt="lg" />
      {component}
    </Layout>
  );
};

export default ARC20SendScreen;
