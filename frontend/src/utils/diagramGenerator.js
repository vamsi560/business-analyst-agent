// Utility functions to generate React Flow diagrams from analysis data

export const generateSystemArchitectureDiagram = (analysisData) => {
  const nodes = [];
  const edges = [];
  let nodeId = 1;
  let yPosition = 100;
  
  // Extract components from analysis data
  const components = extractComponentsFromAnalysis(analysisData);
  
  // Generate nodes for each component with professional layout
  components.forEach((component, index) => {
    const xPosition = 100 + (index % 3) * 300; // Arrange in rows of 3 for better spacing
    const currentY = yPosition + Math.floor(index / 3) * 180;
    
    nodes.push({
      id: nodeId.toString(),
      type: getNodeType(component.type),
      position: { x: xPosition, y: currentY },
      data: { 
        label: component.name, 
        type: component.description || component.type,
        details: component.details,
        // Include additional professional data based on node type
        ...(component.features && { features: component.features }),
        ...(component.capabilities && { capabilities: component.capabilities }),
        ...(component.technologies && { technologies: component.technologies }),
        ...(component.protocols && { protocols: component.protocols }),
        ...(component.endpoints && { endpoints: component.endpoints }),
        ...(component.steps && { steps: component.steps }),
        ...(component.integration && { integration: component.integration }),
      },
    });
    
    // Store component reference for edge generation
    component.nodeId = nodeId.toString();
    nodeId++;
  });
  
  // Generate edges based on component relationships
  components.forEach((component, index) => {
    if (component.dependencies) {
      component.dependencies.forEach(dep => {
        const targetComponent = components.find(c => c.name.toLowerCase().includes(dep.toLowerCase()));
        if (targetComponent) {
          edges.push({
            id: `e${component.nodeId}-${targetComponent.nodeId}`,
            source: component.nodeId,
            target: targetComponent.nodeId,
            animated: true,
            style: { stroke: getEdgeColor(component.type) },
            label: dep.includes('API') ? 'API Call' : 'Data Flow'
          });
        }
      });
    }
  });
  
  return { nodes, edges };
};

export const generateDatabaseDiagram = (analysisData) => {
  const nodes = [];
  const edges = [];
  let nodeId = 1;
  
  // Extract database entities from analysis
  const entities = extractDatabaseEntities(analysisData);
  
  entities.forEach((entity, index) => {
    const angle = (index / entities.length) * 2 * Math.PI;
    const radius = 200;
    const x = 400 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);
    
    nodes.push({
      id: nodeId.toString(),
      type: 'database',
      position: { x, y },
      data: { 
        label: entity.name, 
        type: `${entity.fields?.length || 0} fields` 
      },
    });
    
    entity.nodeId = nodeId.toString();
    nodeId++;
  });
  
  // Generate relationships
  entities.forEach(entity => {
    if (entity.relationships) {
      entity.relationships.forEach(rel => {
        const targetEntity = entities.find(e => e.name.toLowerCase() === rel.target.toLowerCase());
        if (targetEntity) {
          edges.push({
            id: `e${entity.nodeId}-${targetEntity.nodeId}`,
            source: entity.nodeId,
            target: targetEntity.nodeId,
            animated: false,
            style: { stroke: '#3b82f6' },
            label: rel.type
          });
        }
      });
    }
  });
  
  return { nodes, edges };
};

export const generateUserFlowDiagram = (analysisData) => {
  const nodes = [];
  const edges = [];
  let nodeId = 1;
  
  // Extract user journey steps
  const userSteps = extractUserJourney(analysisData);
  
  userSteps.forEach((step, index) => {
    nodes.push({
      id: nodeId.toString(),
      type: 'user',
      position: { x: 100 + index * 200, y: 200 },
      data: { 
        label: step.action, 
        type: step.actor || 'User' 
      },
    });
    
    // Connect sequential steps
    if (index > 0) {
      edges.push({
        id: `e${nodeId-1}-${nodeId}`,
        source: (nodeId-1).toString(),
        target: nodeId.toString(),
        animated: true,
        style: { stroke: '#f59e0b' },
        label: step.trigger || 'Next'
      });
    }
    
    nodeId++;
  });
  
  return { nodes, edges };
};

// Helper functions to extract data from analysis
const extractComponentsFromAnalysis = (analysisData) => {
  const components = [];
  
  // Try to extract from different analysis formats
  if (analysisData.hld && typeof analysisData.hld === 'string') {
    const hldText = analysisData.hld.toLowerCase();
    
    // Common component patterns
    const patterns = [
      { pattern: /frontend|ui|user interface|client/g, type: 'user', name: 'Frontend Application' },
      { pattern: /api gateway|gateway|proxy/g, type: 'api', name: 'API Gateway' },
      { pattern: /backend|server|service/g, type: 'service', name: 'Backend Service' },
      { pattern: /database|db|storage|repository/g, type: 'database', name: 'Database' },
      { pattern: /authentication|auth|login/g, type: 'service', name: 'Authentication Service' },
      { pattern: /notification|email|sms/g, type: 'service', name: 'Notification Service' },
      { pattern: /payment|billing|transaction/g, type: 'service', name: 'Payment Service' },
    ];
    
    patterns.forEach(({ pattern, type, name }) => {
      if (pattern.test(hldText)) {
        components.push({
          name,
          type,
          description: `${name} component`,
          dependencies: extractDependencies(hldText, name)
        });
      }
    });
  }
  
  // Fallback to default professional architecture if no components found
  if (components.length === 0) {
    return [
      { 
        name: 'Business Users', 
        type: 'user', 
        description: 'Web Application', 
        details: 'Business Analysts & Stakeholders',
        dependencies: ['Security Gateway'],
        features: ['Dashboard', 'Reports', 'Analytics']
      },
      { 
        name: 'Security Gateway', 
        type: 'security', 
        description: 'Authentication & Authorization', 
        details: 'Enterprise Security Layer',
        dependencies: ['API Management'],
        protocols: ['OAuth 2.0', 'JWT', 'RBAC']
      },
      { 
        name: 'API Management', 
        type: 'api', 
        description: 'Enterprise API Gateway', 
        details: 'Rate Limiting, Monitoring, Versioning',
        dependencies: ['Document Service', 'Requirements Analysis'],
        endpoints: ['REST', 'GraphQL', 'WebSocket']
      },
      { 
        name: 'Requirements Analysis', 
        type: 'businessProcess', 
        description: 'Core Business Process', 
        details: 'AI-Powered Document Generation',
        dependencies: ['Document Service'],
        steps: ['Extract', 'Analyze', 'Generate', 'Review']
      },
      { 
        name: 'Document Service', 
        type: 'service', 
        description: 'Business Logic Layer', 
        details: 'TRD, HLD, LLD Generation',
        dependencies: ['Enterprise Data'],
        capabilities: ['AI Integration', 'Templates', 'Export']
      },
      { 
        name: 'Workflow Engine', 
        type: 'service', 
        description: 'Process Orchestration', 
        details: 'Approval & DevOps Integration',
        dependencies: ['Enterprise Data', 'Azure DevOps'],
        capabilities: ['Email', 'Azure DevOps', 'Notifications']
      },
      { 
        name: 'Enterprise Data', 
        type: 'database', 
        description: 'Data Persistence Layer', 
        details: 'Documents, Analysis, Metadata',
        dependencies: [],
        technologies: ['PostgreSQL', 'Qdrant Vector DB']
      },
      { 
        name: 'Azure DevOps', 
        type: 'externalSystem', 
        description: 'External Integration', 
        details: 'Work Item Management',
        dependencies: [],
        integration: 'REST API'
      },
    ];
  }
  
  return components;
};

const extractDatabaseEntities = (analysisData) => {
  const entities = [];
  
  if (analysisData.lld && typeof analysisData.lld === 'string') {
    const lldText = analysisData.lld;
    
    // Look for entity/table patterns
    const entityPatterns = [
      /user[s]?|customer[s]?|account[s]?/gi,
      /product[s]?|item[s]?|inventory/gi,
      /order[s]?|transaction[s]?|purchase[s]?/gi,
      /category|categories/gi,
      /review[s]?|rating[s]?|feedback/gi,
    ];
    
    entityPatterns.forEach((pattern, index) => {
      const matches = lldText.match(pattern);
      if (matches) {
        const entityName = matches[0].charAt(0).toUpperCase() + matches[0].slice(1);
        entities.push({
          name: entityName,
          fields: [`${entityName.toLowerCase()}_id`, 'name', 'created_at', 'updated_at'],
          relationships: []
        });
      }
    });
  }
  
  // Fallback entities
  if (entities.length === 0) {
    return [
      { name: 'User', fields: ['user_id', 'name', 'email', 'created_at'], relationships: [] },
      { name: 'Product', fields: ['product_id', 'name', 'price', 'category_id'], relationships: [{ target: 'Category', type: 'belongs_to' }] },
      { name: 'Category', fields: ['category_id', 'name', 'description'], relationships: [] },
    ];
  }
  
  return entities;
};

const extractUserJourney = (analysisData) => {
  const steps = [];
  
  if (analysisData.trd && typeof analysisData.trd === 'string') {
    const trdText = analysisData.trd;
    
    // Look for user action patterns
    const actionPatterns = [
      'login', 'register', 'browse', 'search', 'select', 'add to cart', 
      'checkout', 'payment', 'confirmation', 'logout'
    ];
    
    actionPatterns.forEach((action, index) => {
      if (trdText.toLowerCase().includes(action)) {
        steps.push({
          action: action.charAt(0).toUpperCase() + action.slice(1),
          actor: 'User',
          trigger: index === 0 ? 'Start' : 'Continue'
        });
      }
    });
  }
  
  // Fallback user journey
  if (steps.length === 0) {
    return [
      { action: 'Login', actor: 'User', trigger: 'Start' },
      { action: 'Browse Products', actor: 'User', trigger: 'Navigate' },
      { action: 'Select Product', actor: 'User', trigger: 'Click' },
      { action: 'Add to Cart', actor: 'User', trigger: 'Action' },
      { action: 'Checkout', actor: 'User', trigger: 'Purchase' },
    ];
  }
  
  return steps;
};

const extractDependencies = (text, componentName) => {
  const dependencies = [];
  const lowerText = text.toLowerCase();
  const lowerComponent = componentName.toLowerCase();
  
  if (lowerComponent.includes('frontend') && lowerText.includes('api')) {
    dependencies.push('API Gateway');
  }
  if (lowerComponent.includes('api') && lowerText.includes('service')) {
    dependencies.push('Backend Service');
  }
  if (lowerComponent.includes('service') && lowerText.includes('database')) {
    dependencies.push('Database');
  }
  
  return dependencies;
};

const getNodeType = (componentType) => {
  const typeMap = {
    'frontend': 'user',
    'ui': 'user',
    'client': 'user',
    'user': 'user',
    'users': 'user',
    'api': 'api',
    'gateway': 'api',
    'management': 'api',
    'service': 'service',
    'backend': 'service',
    'server': 'service',
    'engine': 'service',
    'workflow': 'service',
    'database': 'database',
    'db': 'database',
    'storage': 'database',
    'data': 'database',
    'security': 'security',
    'auth': 'security',
    'authentication': 'security',
    'authorization': 'security',
    'process': 'businessProcess',
    'business': 'businessProcess',
    'analysis': 'businessProcess',
    'requirements': 'businessProcess',
    'external': 'externalSystem',
    'integration': 'externalSystem',
    'devops': 'externalSystem',
    'azure': 'externalSystem',
  };
  
  return typeMap[componentType?.toLowerCase()] || 'service';
};

const getEdgeColor = (componentType) => {
  const colorMap = {
    'user': '#f59e0b',
    'api': '#8b5cf6',
    'service': '#10b981',
    'database': '#3b82f6',
  };
  
  return colorMap[componentType] || '#6b7280';
};

export default {
  generateSystemArchitectureDiagram,
  generateDatabaseDiagram,
  generateUserFlowDiagram,
};
