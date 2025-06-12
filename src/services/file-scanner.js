import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

/**
 * File scanner service for detecting llmfiles and folders
 */
class FileScanner {
  // Files to scan in project root
  #filesToScan = [
    'llms.txt',
    'ai-instructions.md',
    'project',
    'context.md',
    '.github/copilot-instructions.md',
    '.continuerules',
    '.clinerules',
    '.roorules',
    '.kilocoderules'
  ];

  // Project relative folders to scan
  #projectFoldersToScan = [
    '.vscode/rules',
    '.roo/rules',
    '.kilocode/rules',
    '.cursor/rules',
    '.continue/rules',
    '.windsurf/rules'
  ];
  // My Documents folder
  #documentFoldersToScan = [
    "Cline/Rules"
  ];
  
  // External folders to scan (absolute paths from environment)
  #externalFoldersToScan = [];

  /**
   * Scan for specified llmfiles and folders in the provided path
   * @param {string} projectPath - The root path to scan
   * @returns {Promise<Object>} - Object containing files and contents
   */
  async scanProject(projectPath) {

    const results = [];

    if (projectPath) {

      try {
        const stats = await fs.stat(projectPath);
        if (!stats.isDirectory()) {
          throw new Error('Provided path is not a directory');
        }
      } catch (error) {
        throw new Error(`Invalid project path: ${error.message}`);
      }

      // Individual files in project root
      await this.#scanFiles(projectPath, results);

      // Project relative folders
      await this.#scanProjectFolders(projectPath, results);
    }

    // External folders (absolute paths)
    await this.#scanExternalFolders(results);

    return results;
  }

  /**
   * Scan for specific files in the project root
   * @param {string} projectPath - Project root path
   * @param {Object} results - Results object to populate
   * @private
   */
  async #scanFiles(projectPath, results) {
    for (const file of this.#filesToScan) {
      const filePath = path.join(projectPath, file);
      await this.#addFileIfExists(filePath, results);
    }
  }

  /**
   * Scan project relative folders for all files
   * @param {string} projectPath - Project root path
   * @param {Object} results - Results object to populate
   * @private
   */
  async #scanProjectFolders(projectPath, results) {
    for (const folder of this.#projectFoldersToScan) {
      const folderPath = path.join(projectPath, folder);
      await this.#scanFolder(folderPath, results);
    }
  }
  
  /**
   * Scan external folders (absolute paths) for all files
   * @param {Object} results - Results object to populate
   * @private
   */
  async #scanExternalFolders(results) {
    // Scan document folders
    await this.#scanDocumentFolders(results);
    
    // Scan external folders from environment
    for (const folder of this.#externalFoldersToScan) {
      await this.#scanFolder(folder, results);
    }
  }

  /**
   * Scan document folders for all files
   * @param {Object} results - Results object to populate
   * @private
   */
  async #scanDocumentFolders(results) {
    try {
      const documentsFolder = await this.#getDocumentsFolder();
      
      for (const folder of this.#documentFoldersToScan) {
        const folderPath = path.join(documentsFolder, folder);
        await this.#scanFolder(folderPath, results);
      }
    } catch (error) {
      console.warn(`Warning: Could not access documents folder: ${error.message}`);
    }
  }
  
  /**
   * Helper method to scan a folder for files
   * @param {string} folderPath - Absolute path to folder
   * @param {Object} results - Results object to populate
   * @private
   */
  async #scanFolder(folderPath, results) {
    try {
      // Check if the directory exists first
      try {
        const stats = await fs.stat(folderPath);
        if (!stats.isDirectory()) {
          return;
        }
      } catch (error) {
        return;
      }

      const files = await fs.readdir(folderPath);

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        await this.#addFileIfExists(filePath, results);
      }
    } catch (error) {
      // Skip folders that can't be accessed
      console.warn(`Warning: Could not access folder ${folderPath}: ${error.message}`);
    }
  }
  
  /**
   * Helper method to get documents folder path
   * @returns {Promise<string>} Path to the user's Documents folder
   * @private
   */
  async #getDocumentsFolder() {
    if (os.platform() === 'win32') {
        
      const docsPath = execSync(
        'powershell -NoProfile -Command "[System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::MyDocuments)"',
        { encoding: 'utf8' }
      ).trim();
      
      if (docsPath && docsPath.length > 0) {
        return docsPath;
      }

    } else if (os.platform() === 'linux') {
      try {
        try {
          execSync('which xdg-user-dir', { stdio: 'ignore' });
          const docsPath = execSync('xdg-user-dir DOCUMENTS', { encoding: 'utf8' }).trim();
          if (docsPath) {
            return docsPath;
          }
        } catch (error) {}
      } catch (error) {

      }
    }

    // Default fallback for all platforms (macOS and fallback for others)
    return path.join(os.homedir(), 'Documents');
  }

  /**
   * Helper method to add a file to results if it exists and is a file
   * @param {string} filePath - Absolute path to file
   * @param {Object} results - Results object to populate
   * @private
   */
  async #addFileIfExists(filePath, results) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        results.push(filePath);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not stat file ${filePath}: ${error.message}`);
      }
      // Ignore missing files
    }
  }
  /**
   * Constructor to initialize FileScanner instance
   */
  constructor() {
    // Add user-defined external folders from environment variable
    const envFolders = process.env.externalFolders;
    
    if (envFolders && typeof envFolders === 'string') {
      const folders = envFolders.split(';').map(folder => folder.trim()).filter(folder => folder);
      this.#externalFoldersToScan = folders;
    }
  }
}


const fileScanner = new FileScanner();
export default fileScanner;
