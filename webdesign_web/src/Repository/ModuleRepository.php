<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Module;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Module>
 */
class ModuleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Module::class);
    }

    /**
     * @return Module[]
     */
    public function getActiveRecommendedModules(int $limit = 10): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.isActive = :isActive')
            ->andWhere('m.isRecommended = :isRecommended')
            ->setParameter('isActive', true)
            ->setParameter('isRecommended', true)
            ->orderBy('m.rating', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Module[]
     */
    public function getAllModules(): array
    {
        return $this->createQueryBuilder('m')
            ->orderBy('m.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Module|null
     */
    public function findRecommendedModuleByIcon(?string $iconClass): ?Module
    {
        return $this->createQueryBuilder('m')
            ->where('m.isRecommended = :isRecommended')
            ->andWhere('m.isActive = :isActive')
            ->andWhere('m.iconClass = :iconClass')
            ->setParameter('isRecommended', true)
            ->setParameter('isActive', true)
            ->setParameter('iconClass', $iconClass)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
