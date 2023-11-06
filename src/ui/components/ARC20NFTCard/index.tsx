// import { TokenBalance } from '@/shared/types';
import { Card } from '../Card';
import { Column } from '../Column';
import { Row } from '../Row';
import { Text } from '../Text';
import { returnImageType } from '@/ui/utils';
import { Tag } from '../Tag';
import Checkbox from '../Checkbox';
import { IAtomicalItem } from '@/background/service/interfaces/api';
// import Checkbox from '../Checkbox';

export interface ARC20NFTCardProps {
  tokenBalance: IAtomicalItem;
  onClick?: () => void;
  checkbox?: boolean;
  selectvalues?: string[];
}

export default function ARC20NFTCard(props: ARC20NFTCardProps) {
  const {
    tokenBalance: { value, atomical_number, atomical_id },
    checkbox,
    selectvalues,
    onClick
  } = props;

  const { type, content, tag, contentType, buffer } = returnImageType(props.tokenBalance);

  const Content = () => {
    if (contentType.includes('stream') || !buffer) return null;
    if (contentType.startsWith('image/')) {
      return (
        <img
          src={content}
          style={{
            height: 24,
            maxWidth: 140
          }}
        />
      );
    } else if (contentType.startsWith('video/')) {
      return (
        <video
          src={content}
          autoPlay={true}
          loop={true}
          muted={true}
          controls={true}
          style={{
            objectFit: 'cover',
            height: 24,
            maxWidth: 140
          }}
          className="object-cover"
        />
      );
    } else if (contentType.startsWith('audio/')) {
      return <audio src={content} autoPlay={false} loop={true} controls={true} />;
    } else if (
      contentType.startsWith('font/') ||
      contentType.includes('/html') ||
      contentType.includes('/javascript') ||
      contentType.includes('/css') ||
      contentType.includes('/pdf')
    ) {
      return (
        <iframe
          src={content}
          style={{
            height: 24,
            maxWidth: 140,
          }}
          className="object-contain w-full h-full primary-text pointer-events-none"
          frameBorder="none"
        />
      );
    } else if (contentType.startsWith('text/')) {
      if (buffer) {
        return (
          <div
            style={{
              height: 24,
              maxWidth: 140
            }}
            className="text-md break-all p-1 flex flex-wrap justify-center items-center aspect-square overflow-hidden leading-none">
            {buffer && new TextDecoder().decode(new Uint8Array(buffer))}
          </div>
        );
      } else {
        return null;
      }
    }
    return (
      <iframe
        src={content}
        style={{
          height: 24,
          maxWidth: 140
        }}
        className="object-contain w-full h-full primary-text pointer-events-none"
        frameBorder="none"
      />
    );
  };

  return (
    <Card
      style={{
        backgroundColor: '#141414',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        // width: 150,
        height: 120,
        minWidth: 150,
        minHeight: 120
      }}
      onClick={onClick}>
      <Column full gap={'xs'}>
        <Row justifyBetween itemsCenter>
          <Text text={`# ${atomical_number.toLocaleString()}`} color="blue" />
          {checkbox && <Checkbox value={`${atomical_id}`} checked={selectvalues?.includes(`${atomical_id}`)} />}
        </Row>
        <Row style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Column>
          <div>
            {type === 'unknown' ? (
              <Text text={'unknown'} />
            ) : type === 'nft' ? (
              <Tag
                preset="default"
                text={tag}
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  maxWidth: 120,
                  fontSize: 10,
                  display: 'inline-block',
                  textOverflow: 'ellipsis'
                }}
              />
            ) : (
              <Tag style={{fontSize: 10}} preset="success" text={'Realm'} />
            )}
          </div>
          <Row justifyCenter>
            {type === 'unknown' ? (
              <Text text={'unknown'} />
            ) : type === 'nft' ? (
              <div
                style={{
                  maxWidth: 140,
                  height: 24
                }}>
                <Content />
              </div>
            ) : (
              <Text text={content} color="textDim" size="xl" />
            )}
          </Row>
          <Text text={`${value.toLocaleString()} sats`} size="xs" />
        </Column>
      </Column>
    </Card>
  );
}
