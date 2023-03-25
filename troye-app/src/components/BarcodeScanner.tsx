import QrHunter from '@stevent-team/react-qr-hunter'


export const BarcodeScanner = ({ setBarcodeValue }: { setBarcodeValue: (value: string) => void }) => {
  return (
    <QrHunter
      onScan={(result: any) => {
        setBarcodeValue(result.data);
      }}
      onError={(error: string) => console.log(error)}
    />
  );
};