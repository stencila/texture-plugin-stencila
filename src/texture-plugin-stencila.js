import { Texture } from 'substance-texture'
import CodeEditor from './code-editor/CodeEditor'
import RunCellCommand from './RunCellCommand'
import RunAllCellsCommand from './RunAllCellsCommand'
import StencilaCell from './StencilaCell'
import StencilaCellComponent from './StencilaCellComponent'
import StencilaCellConverter from './StencilaCellConverter'
import StencilaInlineCell from './StencilaInlineCell'
import StencilaInlineCellComponent from './StencilaInlineCellComponent'
import StencilaInlineCellConverter from './StencilaInlineCellConverter'
import StencilaCellService from './StencilaCellService'
import JavascriptRuntimeService from './jsruntime/JavascriptRuntimeService'
import StencilaArticleJATSImporter from './StencilaArticleJATSImporter'
import StencilaArticleJATSExporter from './StencilaArticleJATSExporter'

const RDS_JATS_PUBLIC_ID = '-//RDS/DTD Stencila Reproducible Documents DTD v1.0'

Texture.registerPlugin({
  name: 'stencila-plugin',
  configure (configurator) {
    let articleConfig = configurator.getConfiguration('article')

    articleConfig.addService(StencilaCellService.id, StencilaCellService.create)
    articleConfig.addService(JavascriptRuntimeService.id, JavascriptRuntimeService.create)
    // TODO register more runtime services, or a universal StencilaRuntimeService

    // let Texture know about a JATS customization used by this plugin
    articleConfig.registerSchemaId(RDS_JATS_PUBLIC_ID)

    // register additional nodes for the internal article document model
    articleConfig.addNode(StencilaCell)
    articleConfig.addNode(StencilaInlineCell)
    // register converters for custom elements
    articleConfig.addConverter(RDS_JATS_PUBLIC_ID, StencilaCellConverter)
    articleConfig.addConverter(RDS_JATS_PUBLIC_ID, StencilaInlineCellConverter)
    articleConfig.addImporter(RDS_JATS_PUBLIC_ID, StencilaArticleJATSImporter, {
      converterGroups: ['jats', RDS_JATS_PUBLIC_ID]
    })
    // register a factory for an exporter
    articleConfig.addExporter(RDS_JATS_PUBLIC_ID, StencilaArticleJATSExporter, {
      converterGroups: ['jats', RDS_JATS_PUBLIC_ID]
    })
    // add commands and components to the article manuscript configuration
    let articleManuscriptConfig = configurator.getConfiguration('article.manuscript')

    articleManuscriptConfig.addCommand(RunCellCommand.id, RunCellCommand, { commandGroup: 'stencila:cells' })
    articleManuscriptConfig.addCommand(RunAllCellsCommand.id, RunAllCellsCommand, { commandGroup: 'stencila:cells' })

    articleManuscriptConfig.addComponent('code-editor', CodeEditor)
    articleManuscriptConfig.addComponent(StencilaCell.type, StencilaCellComponent)
    articleManuscriptConfig.addComponent(StencilaInlineCell.type, StencilaInlineCellComponent)

    articleManuscriptConfig.addKeyboardShortcut('CommandOrControl+ENTER', { command: RunCellCommand.id })

    articleManuscriptConfig.addLabel('stencila:cell-tools', 'Cell')
    articleManuscriptConfig.addLabel('stencila:run-cell', 'Run Cell')
    articleManuscriptConfig.addLabel('stencila:run-all-cells', 'Run All Cells')
    articleManuscriptConfig.addLabel('stencila:language', 'Language')
    articleManuscriptConfig.addLabel('stencila:status:ok', 'ok')
    articleManuscriptConfig.addLabel('stencila:status:not-evaluated', 'N/A')
    articleManuscriptConfig.addLabel('stencila:status:error', 'error')
    articleManuscriptConfig.addLabel('stencila:placeholder:source', 'Enter Source Code')

    articleManuscriptConfig.addIcon('stencila:expand-code', { 'fontawesome': 'fa-angle-right' })
    articleManuscriptConfig.addIcon('stencila:collapse-code', { 'fontawesome': 'fa-angle-down' })

    // EXPERIMENTAL: we do not have an easy way to extend the toolbar et al.
    // for now this is needs understanding of the internal toolpanel layout
    // until we understand better what we need
    articleManuscriptConfig.extendToolPanel('toolbar', toolPanelConfig => {
      let contextTools = toolPanelConfig.find(group => group.name === 'context-tools')
      if (contextTools) {
        contextTools.items.push({
          type: 'group',
          name: 'stencila:cells',
          style: 'descriptive',
          label: 'stencila:cell-tools',
          items: [
            { type: 'command-group', name: 'stencila:cells' }
          ]
        })
      }
    })
    articleManuscriptConfig.extendToolPanel('context-menu', toolPanelConfig => {
      toolPanelConfig[0].items.push(
        { type: 'command-group', name: 'stencila:cells' }
      )
    })
  }
})
