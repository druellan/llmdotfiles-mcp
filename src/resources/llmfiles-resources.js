import fileScanner from '../services/file-scanner.js';
import path from 'path';

/**
 * Resource handler for llmfiles
 */
class llmfilesResources {

  /**
   * Get a list of available dotfile resources
   * @param {string} projectPath - The root path to scan
   * @returns {Promise<Array>} List of available resources
   */
  async listResources(projectPath) {

    try {
      const llmfiles = await fileScanner.scanProject(projectPath);

      const resources = llmfiles.map((filepath) => {

        const filename = path.basename(filepath);
        return {
          uri: `file:///${filepath.replace(/\\/g, '/')}`,
          name: filename,
          description: `Configuration or rules file: ${filename}`,
          mimeType: 'text/plain'
        };
      });
      
      // Add special "all" resource for bulk reading
      if (resources.length > 0) {
        resources.unshift({
          uri: 'llmfiles://all-rules',
          name: 'all-rules',
          description: 'Consolidated view of all available rules and configuration files',
          mimeType: 'text/plain'
        });
      }
      
      console.debug(`Found ${resources.length} resources`);
      return resources;

    } catch (error) {
      console.error(`Error listing llmfiles resources: ${error.message}`);
      throw new Error(`Failed to list llmfiles resources: ${error.message}`);
    }
  }

  /**
   * Read the content of a specific dotfile resource
   * Read the content of ALL dotfile resources if the URI is 'llmfiles://all-rules'
   * @param {string} uri - Resource URI in the format file:///{filepath}
   * @returns {Promise<Object>} Resource content
   */
  async readResource(uri) {
    // Handle special "all-rules" URI
    if (uri === 'llmfiles://all-rules') {
      try {
        // Get all available files by scanning again
        const llmfiles = await fileScanner.scanProject(process.env.ProjectPath);
        const allRulesContent = [];
        
        for (const filepath of llmfiles) {
          try {
            const content = await (await import('fs')).promises.readFile(filepath, 'utf8');
            const filename = path.basename(filepath);
            allRulesContent.push(`# Rules from ${filepath}:\n${content}`);
          } catch (error) {
            console.warn(`Could not read file ${filepath}: ${error.message}`);
          }
        }
        
        const consolidatedContent = `# Consolidated Rules and Guidelines
This resource contains all available rules and guidelines from the llmdotfiles MCP server.
${allRulesContent.join('\n---\n')}
**End of Consolidated Rules**`;

        return {
          uri,
          mimeType: 'text/plain',
          text: consolidatedContent
        };
      } catch (error) {
        console.error(`Error reading all rules: ${error.message}`);
        throw new Error(`Failed to read consolidated rules: ${error.message}`);
      }
    }

    if (!uri.startsWith('file:///')) {
      throw new Error('Invalid file resource URI');
    }

    try {
      const filepath = uri.replace('file:///', '').replace(/\//g, path.sep);
      const content = await fileScanner.constructor.prototype.constructor.name === 'FileScanner'
        ? await (await import('fs')).promises.readFile(filepath, 'utf8')
        : '';
      return {
        uri,
        mimeType: 'text/plain',
        text: content
      };
    } catch (error) {
      console.error(`Error reading resource: ${error.message}`);
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  }
}

export default new llmfilesResources();
