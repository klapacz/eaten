export type Encoder<TEncoded, TDecoded> = {
  decode: (value: TEncoded) => TDecoded
  encode: (value: TDecoded) => TEncoded
}
