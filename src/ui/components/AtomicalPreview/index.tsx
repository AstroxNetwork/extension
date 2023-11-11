import { CSSProperties } from 'react';

import { colors } from '@/ui/theme/colors';

import { returnImageType } from '../../utils';
import { Column } from '../Column';
import { Row } from '../Row';
import { Text } from '../Text';
import { IAtomicalItem } from '@/background/service/interfaces/api';
import { Tag } from '../Tag';
import { Card } from '../Card';

const $viewPresets = {
  large: {},

  medium: {},

  small: {}
};

const $containerPresets: Record<Presets, CSSProperties> = {
  large: {
    backgroundColor: colors.black,
    width: 300
  },
  medium: {
    backgroundColor: colors.black,
    width: 144,
    height: 180
  },
  small: {
    backgroundColor: colors.black,
    width: 80
  }
};

type Presets = keyof typeof $viewPresets;

export interface AtomicalProps {
  data: IAtomicalItem;
  preset: Presets;
}

export default function AtomicalPreview({ data, preset }: AtomicalProps) {
  const numberStr = `# ${data.atomical_number}`;

  const { type, content, tag, contentType, buffer } = returnImageType(data);

  const Content = () => {
    if (contentType.includes('stream') || !buffer) return null;
    if (contentType.startsWith('image/')) {
      return (
        <img
          src={content}
          style={{
            height: 48,
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
            height: 48,
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
            height: 48,
            maxWidth: 140
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
              height: 48,
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
          height: 48,
          maxWidth: 140
        }}
        className="object-contain w-full h-full primary-text pointer-events-none"
        frameBorder="none"
      />
    );
  };

  return (
    <Column gap="zero" style={Object.assign({ position: 'relative' }, $containerPresets[preset])}>
      <Column full gap={'md'}>
        {data.type === 'FT' ? (
          <Column style={{
            padding: 12,
          }}>
            <Row justifyCenter>
              <Text text={data.$ticker} size="xl" />
            </Row>
            <Row justifyCenter>
              <Text textCenter text={numberStr} color="blue" size='xs' />
            </Row>
          </Column>
        ) : (
          <Card
            style={{
              backgroundColor: '#141414',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 5,
              // width: 150,
              height: 120,
              minWidth: 150,
              minHeight: 120
            }}>
            <Column full gap={'md'}>
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
                  <Tag style={{ fontSize: 10 }} preset="success" text={'Realm'} />
                )}
              </div>
              <Row justifyCenter>
                {type === 'unknown' ? (
                  <Text text={'unknown'} />
                ) : type === 'nft' ? (
                  <div
                    style={{
                      maxWidth: 140,
                      height: 48
                    }}>
                    <Content />
                  </div>
                ) : (
                  <Text text={content} color="textDim" size="xl" />
                )}
              </Row>
              <Row justifyCenter>
                <Text text={numberStr} textCenter color="blue" size='xs' />
              </Row>
            </Column>
          </Card>
        )}
      </Column>
    </Column>
  );
}
