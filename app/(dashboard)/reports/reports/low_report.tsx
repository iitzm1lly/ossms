"use client"

// import { useState, useEffect } from 'react';
// import { Document, Page, Image, View } from '@react-pdf/renderer';
// import ChartJsImage from 'chartjs-to-image';

// export const LowStockReport = () => {
//   const [imageSrc, setImageSrc] = useState<string | null>(null);

//   useEffect(() => {
//     const myChart = new ChartJsImage();
//     myChart.setConfig({
//       type: 'bar',
//       data: {
//         labels: ['Hello world', 'Foo bar'],
//         datasets: [{ label: 'Foo', data: [1, 2] }]
//       },
//     });
//     myChart.toDataUrl().then((data) => setImageSrc(data));
//   }, []);

//   return (
//     <Document>
//       <Page>
//         <View>
//           <Image src={`${imageSrc}`} />
//         </View>
//       </Page>
//     </Document>
//   );
// };

