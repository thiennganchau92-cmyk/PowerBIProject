<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: https://localhost:8080/, https://[::1]:8080/
<i> [webpack-dev-server] On Your Network (IPv4): https://192.168.1.40:8080/
<i> [webpack-dev-server] Content not from webpack is served from 'D:\PowerBIProject\Project Visuals\powerSlicer\.tmp\drop' directory
 info   Server listening on port 8080
 info   Finish packaging
Webpack Bundle Analyzer saved report to D:\PowerBIProject\Project Visuals\powerSlicer\webpack.statistics.dev.html
assets by chunk 106 KiB (name: visual.js)
  asset visual.js 100 KiB [compared for emit] (name: visual.js)
  asset visual.css 5.37 KiB [compared for emit] (name: visual.js)
assets by path ../build/ 1.25 KiB
  asset ../build/src/visual.d.ts 1010 bytes [compared for emit]
  asset ../build/.tmp/precompile/visualPlugin.d.ts 269 bytes [compared for emit]
asset status 63 bytes [emitted] [compared for emit]
Entrypoint visual.js 106 KiB = visual.css 5.37 KiB visual.js 100 KiB
orphan modules 7.08 KiB (javascript) 937 bytes (runtime) [orphan] 7 modules
runtime modules 670 bytes 3 modules
cacheable modules 31.7 KiB (javascript) 1.58 KiB (css/mini-extract)
  modules by path ./node_modules/powerbi-visuals-utils-formattingmodel/lib/ 26.1 KiB
    ./node_modules/powerbi-visuals-utils-formattingmodel/lib/index.js 230 bytes [built] [code generated]
    ./node_modules/powerbi-visuals-utils-formattingmodel/lib/FormattingSetting...(truncated) 12.6 KiB [built] [code generated]
    ./node_modules/powerbi-visuals-utils-formattingmodel/lib/FormattingSett...(truncated) 12 KiB [built] [code generated]
    ./node_modules/powerbi-visuals-utils-formattingmodel/lib/utils/FormattingSe...(truncated) 1.33 KiB [built] [code generated]
  modules by path ./style/*.less 50 bytes (javascript) 1.58 KiB (css/mini-extract)
    ./style/visual.less 50 bytes [built] [code generated]
    css C:\Users\nganct\AppData\Roaming\npm\node_modules\powerbi-visuals-tools\node_modules\css-loader\dist\cjs.js!C:\Users\nganct\AppData\Roaming\npm\node_modules\powerbi-visuals-tools\node_modules\less-loader\dist\cjs.js??ruleSet[1].rules[3].use[2]!./style/visual.less 1.58 KiB [built] [code generated]
  ./.tmp/precompile/visualPlugin.ts 1.04 KiB [built] [code generated]
  ./src/visual.ts 4.46 KiB [built] [code generated] [2 errors]

ERROR in D:\PowerBIProject\Project Visuals\powerSlicer\src\visual.ts
./src/visual.ts 38:9-23
[tsl] ERROR in D:\PowerBIProject\Project Visuals\powerSlicer\src\visual.ts(38,10)
      TS2614: Module '"powerbi-visuals-api"' has no exported member 'ITableDataView'. Did you mean to use 'import ITableDataView from "powerbi-visuals-api"' instead?
ts-loader-default_e3b0c44298fc1c14
 @ ./.tmp/precompile/visualPlugin.ts 1:0-42 10:12-18 11:23-29

ERROR in D:\PowerBIProject\Project Visuals\powerSlicer\src\visual.ts
./src/visual.ts 38:25-44
[tsl] ERROR in D:\PowerBIProject\Project Visuals\powerSlicer\src\visual.ts(38,26)
      TS2614: Module '"powerbi-visuals-api"' has no exported member 'IFilterColumnTarget'. Did you mean to use 'import IFilterColumnTarget from "powerbi-visuals-api"' instead?
ts-loader-default_e3b0c44298fc1c14
 @ ./.tmp/precompile/visualPlugin.ts 1:0-42 10:12-18 11:23-29

webpack 5.102.1 compiled with 2 errors in 2741 ms