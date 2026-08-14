// Register only the ECharts pieces this app uses.
// Importing all of echarts would add ~1MB for nothing.
// Canvas renderer on purpose: the PDF export reads the chart
// as an image, and that only works with canvas.
import { BarChart, ScatterChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer])