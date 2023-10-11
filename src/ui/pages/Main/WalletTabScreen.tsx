import { Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { KEYRING_TYPE } from '@/shared/constant';
import { TokenBalance, NetworkType, Inscription } from '@/shared/types';
import { Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import AccountSelect from '@/ui/components/AccountSelect';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressBar } from '@/ui/components/AddressBar';
import BRC20BalanceCard from '@/ui/components/BRC20BalanceCard';
import { Button } from '@/ui/components/Button';
import { Empty } from '@/ui/components/Empty';
import InscriptionPreview from '@/ui/components/InscriptionPreview';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { Pagination } from '@/ui/components/Pagination';
import { TabBar } from '@/ui/components/TabBar';
import { UpgradePopver } from '@/ui/components/UpgradePopver';
import { getCurrentTab } from '@/ui/features/browser/tabs';
import { useAccountBalance, useAtomicals, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useAppDispatch } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import {
  useBlockstreamUrl,
  useNetworkType,
  useSkipVersionCallback,
  useVersionInfo,
  useWalletConfig
} from '@/ui/state/settings/hooks';
import { useWalletTabScreenState } from '@/ui/state/ui/hooks';
import { WalletTabScreenTabKey, uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { useWallet } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';

import { useNavigate } from '../MainRoute';
import { IAtomicalBalances } from '@/background/service/interfaces/api';
import ARC20BalanceCard from '@/ui/components/ARC20BalanceCard';

export default function WalletTabScreen() {
  const navigate = useNavigate();

  const accountBalance = useAccountBalance();
  const networkType = useNetworkType();
  const isTestNetwork = networkType === NetworkType.TESTNET;

  const currentKeyring = useCurrentKeyring();
  const currentAccount = useCurrentAccount();
  const balanceValue = useMemo(() => {
    if (accountBalance.amount === '0') {
      return '--';
    } else {
      return accountBalance.amount;
    }
  }, [accountBalance.amount]);

  const wallet = useWallet();
  const [connected, setConnected] = useState(false);

  const dispatch = useAppDispatch();
  const { tabKey } = useWalletTabScreenState();

  const skipVersion = useSkipVersionCallback();

  const walletConfig = useWalletConfig();
  const versionInfo = useVersionInfo();

  useEffect(() => {
    const run = async () => {
      const activeTab = await getCurrentTab();
      if (!activeTab) return;
      const site = await wallet.getCurrentConnectedSite(activeTab.id);
      if (site) {
        setConnected(site.isConnected);
      }
    };
    run();
  }, []);

  const tabItems = [
    {
      key: WalletTabScreenTabKey.ALL,
      label: 'ALL',
      children: <ARC20List />
    },
    {
      key: WalletTabScreenTabKey.FT,
      label: 'FT',
      children: <ARC20List />
    },
    {
      key: WalletTabScreenTabKey.NFT,
      label: 'NFT',
      children: <ARC20List />
    },
  ];

  const blockstreamUrl = useBlockstreamUrl();

  return (
    <Layout>
      <Header
        LeftComponent={
          <Column>
            {connected && (
              <Row
                itemsCenter
                onClick={() => {
                  navigate('ConnectedSitesScreen');
                }}>
                <Text text="·" color="green" size="xxl" />
                <Text text="Dapp Connected" size="xxs" />
              </Row>
            )}
          </Column>
        }
        RightComponent={
          <Card
            preset="style2"
            onClick={() => {
              navigate('SwitchKeyringScreen');
            }}>
            <Text text={currentKeyring.alianName} size="xxs" />
          </Card>
        }
      />
      <Content>
        <Column gap="xl">
          {currentKeyring.type === KEYRING_TYPE.HdKeyring && <AccountSelect />}

          {isTestNetwork && <Text text="Bitcoin Testnet is used for testing." color="danger" textCenter />}

          {walletConfig.statusMessage && <Text text={walletConfig.statusMessage} color="danger" textCenter />}

          <Tooltip
            title={
              <span>
                <Row justifyBetween>
                  <span>{'BTC Balance'}</span>
                  <span>{` ${accountBalance.btc_amount} BTC`}</span>
                </Row>
                <Row justifyBetween>
                  <span>{'Inscription Balance'}</span>
                  <span>{` ${accountBalance.inscription_amount} BTC`}</span>
                </Row>
              </span>
            }
            overlayStyle={{
              fontSize: fontSizes.xs
            }}>
            <div>
              <Text text={balanceValue + '  BTC'} preset="title-bold" textCenter size="xxxl" />
            </div>
          </Tooltip>

          <AddressBar />

          <Row justifyBetween>
            <Button
              text="Receive"
              preset="default"
              icon="receive"
              onClick={(e) => {
                navigate('ReceiveScreen');
              }}
              full
            />

            <Button
              text="Send"
              preset="default"
              icon="send"
              onClick={(e) => {
                navigate('TxCreateScreen');
              }}
              full
            />
            {/* {walletConfig.moonPayEnabled && (
              <Button
                text="Buy"
                preset="default"
                icon="bitcoin"
                onClick={(e) => {
                  navigate('MoonPayScreen');
                }}
                full
              />
            )} */}
          </Row>

          <Row justifyBetween>
            <TabBar
              defaultActiveKey={tabKey}
              activeKey={tabKey}
              items={tabItems}
              onTabClick={(key) => {
                dispatch(uiActions.updateWalletTabScreen({ tabKey: key }));
              }}
            />
            <Row
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/address/${currentAccount.address}`);
              }}>
              <Text text={'View History'} size="xs" />
              <Icon icon="link" size={fontSizes.xs} />
            </Row>
          </Row>

          {tabItems[tabKey].children}
        </Column>
        {!versionInfo.skipped && (
          <UpgradePopver
            onClose={() => {
              skipVersion(versionInfo.newVersion);
            }}
          />
        )}
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="home" />
      </Footer>
    </Layout>
  );
}

function InscriptionList() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();

  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [total, setTotal] = useState(-1);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 100 });

  const tools = useTools();

  const fetchData = async () => {
    try {
      // tools.showLoading(true);
      const { list, total } = await wallet.getAllInscriptionList(
        currentAccount.address,
        pagination.currentPage,
        pagination.pageSize
      );
      setInscriptions(list);
      setTotal(total);
    } catch (e) {
      tools.toastError((e as Error).message);
    } finally {
      // tools.showLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination]);

  if (total === -1) {
    return (
      <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
        <LoadingOutlined />
      </Column>
    );
  }

  if (total === 0) {
    return (
      <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
        <Empty text="Empty" />
      </Column>
    );
  }

  return (
    <Column>
      {/* <Row style={{ flexWrap: 'wrap' }} gap="lg">
        {inscriptions.map((data, index) => (
          <InscriptionPreview
            key={index}
            data={data}
            preset="medium"
            onClick={() => {
              navigate('OrdinalsDetailScreen', { inscription: data, withSend: true });
            }}
          />
        ))}
      </Row> */}
      <Row justifyCenter mt="lg">
        <Pagination
          pagination={pagination}
          total={total}
          onChange={(pagination) => {
            setPagination(pagination);
          }}
        />
      </Row>
    </Column>
  );
}

// function BRC20List() {
//   const navigate = useNavigate();
//   const wallet = useWallet();
//   const currentAccount = useCurrentAccount();

//   const [tokens, setTokens] = useState<TokenBalance[]>([]);
//   const [total, setTotal] = useState(-1);
//   const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 100 });

//   const tools = useTools();
//   const fetchData = async () => {
//     try {
//       // tools.showLoading(true);
//       const { list, total } = await wallet.getBRC20List(
//         currentAccount.address,
//         pagination.currentPage,
//         pagination.pageSize
//       );
//       setTokens(list);
//       setTotal(total);
//     } catch (e) {
//       tools.toastError((e as Error).message);
//     } finally {
//       // tools.showLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [pagination]);

//   if (total === -1) {
//     return (
//       <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
//         <LoadingOutlined />
//       </Column>
//     );
//   }

//   if (total === 0) {
//     return (
//       <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
//         <Empty text="Empty" />
//       </Column>
//     );
//   }

//   return (
//     <Column>
//       {/* <Row style={{ flexWrap: 'wrap' }} gap="sm">
//         {tokens.map((data, index) => (
//           <BRC20BalanceCard
//             key={index}
//             tokenBalance={data}
//             onClick={() => {
//               navigate('BRC20TokenScreen', { tokenBalance: data, ticker: data.ticker });
//             }}
//           />
//         ))}
//       </Row> */}

//       <Row justifyCenter mt="lg">
//         <Pagination
//           pagination={pagination}
//           total={total}
//           onChange={(pagination) => {
//             setPagination(pagination);
//           }}
//         />
//       </Row>
//     </Column>
//   );
// }

function ARC20List() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();

  // const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [total, setTotal] = useState(-1);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 100 });
  // const [balanceMap, setBalanceMap] = useState<IAtomicalBalances | undefined>(undefined);
  const atomicals = useAtomicals();

  const tools = useTools();
  // const fetchData = async () => {
  //   try {
  //     // tools.showLoading(true);
  //     // const { list, total } = await wallet.getBRC20List(
  //     //   currentAccount.address,
  //     //   pagination.currentPage,
  //     //   pagination.pageSize
  //     // );
  //     // setTokens(list);
  //     // setTotal(total);
  //     const { atomicals_confirmed, atomicals_balances, atomicals_utxos } = await wallet.getAtomicals(
  //       // currentAccount.address,
  //       'bc1pzxmvax02krvgw0tc06v7dz34zdvz9zynehcsfxky32h9zwg4nz4sjlq3qc',
  //     );

  //     setBalanceMap(atomicals_balances as IAtomicalBalances);
  //     setTotal(atomicals_utxos.length);

  //     console.log(atomicals_balances);
  //   } catch (e) {
  //     tools.toastError((e as Error).message);
  //   } finally {
  //     // tools.showLoading(false);
  //   }
  // };
  console.log('atomicals',atomicals)

  useEffect(() => {
    // fetchData();
  }, [pagination]);

  if (
    atomicals?.atomicalBalances === undefined
    ) {
    return (
      <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
        <LoadingOutlined />
      </Column>
    );
  }

  if (atomicals.atomicalBalances === undefined) {
    return (
      <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
        <Empty text="Empty" />
      </Column>
    );
  }

  return (
    <Column>
      <Row style={{ flexWrap: 'wrap' }} gap="sm">
        {Object.values(atomicals.atomicalBalances)
          .filter((d) => d.type === 'FT')
          .map((data, index) => (
            <ARC20BalanceCard
              key={index}
              tokenBalance={data}
              onClick={() => {
                // alert('https://atomicalswallet.com');
                navigate('ARC20SendScreen', { tokenBalance: data, ticker: data.ticker });
              }}
            />
          ))}
      </Row>

      <Row justifyCenter mt="lg">
        <Pagination
          pagination={pagination}
          total={total}
          onChange={(pagination) => {
            setPagination(pagination);
          }}
        />
      </Row>
    </Column>
  );
}
